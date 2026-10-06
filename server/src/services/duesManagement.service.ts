import { SQS, SNS } from 'aws-sdk';
import { EnterprisePaymentService } from './enterprisePayment.service';
import DuesPayment from '../models/duesPayment.models';
import Group from '../models/group.models';
import Association from '../models/association.models';

interface DuesGenerationRequest {
  groupId: string;
  period: string;
  initiatedBy: string;
}

interface DuesPaymentRequest {
  groupId: string;
  memberId: string;
  paymentIds: string[];
}

export class DuesManagementService {
  private sqs: SQS;
  private sns: SNS;
  private paymentService: EnterprisePaymentService;

  constructor() {
    this.sqs = new SQS({ region: process.env.AWS_REGION });
    this.sns = new SNS({ region: process.env.AWS_REGION });
    this.paymentService = new EnterprisePaymentService();
  }

  // Generate dues for all group members (async processing)
  async generateGroupDues(request: DuesGenerationRequest): Promise<{ jobId: string; estimatedMembers: number }> {
    try {
      const group = await Group.findById(request.groupId).populate('communityId');
      if (!group || !group.settings.dues.enabled) {
        throw new Error('Group not found or dues not enabled');
      }

      const association = await Association.findById(group.communityId);
      const activeMembers = association?.members.filter((m: any) => m.isActive) || [];

      // Queue dues generation job
      const jobId = `dues-gen-${Date.now()}-${request.groupId}`;
      
      await this.sqs.sendMessage({
        QueueUrl: process.env.DUES_GENERATION_QUEUE_URL!,
        MessageBody: JSON.stringify({
          jobId,
          groupId: request.groupId,
          period: request.period,
          initiatedBy: request.initiatedBy,
          memberCount: activeMembers.length,
          duesAmount: group.settings.dues.amount,
          frequency: group.settings.dues.frequency,
          dueDate: this.calculateDueDate(group.settings.dues.frequency, group.settings.dues.dueDate)
        }),
        MessageAttributes: {
          JobType: { StringValue: 'DUES_GENERATION', DataType: 'String' },
          Priority: { StringValue: 'HIGH', DataType: 'String' }
        }
      }).promise();

      // Send notification to admin
      await this.notifyAdmin(request.groupId, 'DUES_GENERATION_STARTED', {
        period: request.period,
        memberCount: activeMembers.length,
        jobId
      });

      return {
        jobId,
        estimatedMembers: activeMembers.length
      };

    } catch (error: any) {
      await this.notifyAdmin(request.groupId, 'DUES_GENERATION_FAILED', {
        error: error.message,
        period: request.period
      });
      throw error;
    }
  }

  // Process dues generation (SQS handler)
  async processDuesGeneration(message: any): Promise<void> {
    const { jobId, groupId, period, memberCount, duesAmount, dueDate } = message;
    
    try {
      const group = await Group.findById(groupId);
      const association = await Association.findById(group?.communityId);
      const activeMembers = association?.members.filter((m: any) => m.isActive) || [];

      const duesPayments = [];
      let processedCount = 0;
      let skippedCount = 0;

      // Process in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < activeMembers.length; i += batchSize) {
        const batch = activeMembers.slice(i, i + batchSize);
        
        for (const member of batch) {
          // Check if dues already exist
          const existingDues = await DuesPayment.findOne({
            groupId,
            memberId: member.userId,
            period
          });

          if (!existingDues) {
            duesPayments.push({
              groupId,
              memberId: member.userId,
              amount: duesAmount,
              period,
              dueDate: new Date(dueDate),
              status: 'pending'
            });
            processedCount++;
          } else {
            skippedCount++;
          }
        }

        // Insert batch
        if (duesPayments.length > 0) {
          await DuesPayment.insertMany(duesPayments);
          duesPayments.length = 0; // Clear array
        }

        // Progress notification every 500 members
        if ((i + batchSize) % 500 === 0) {
          await this.notifyAdmin(groupId, 'DUES_GENERATION_PROGRESS', {
            jobId,
            processed: Math.min(i + batchSize, activeMembers.length),
            total: activeMembers.length,
            progress: Math.round((Math.min(i + batchSize, activeMembers.length) / activeMembers.length) * 100)
          });
        }
      }

      // Send completion notification
      await this.notifyAdmin(groupId, 'DUES_GENERATION_COMPLETED', {
        jobId,
        period,
        processedCount,
        skippedCount,
        totalMembers: activeMembers.length
      });

      // Trigger member notifications
      await this.triggerMemberNotifications(groupId, period);

    } catch (error: any) {
      await this.notifyAdmin(groupId, 'DUES_GENERATION_FAILED', {
        jobId,
        error: error.message,
        period
      });
      throw error;
    }
  }

  // Initialize payment for member
  async initializeMemberPayment(request: DuesPaymentRequest, userEmail: string): Promise<any> {
    try {
      const group = await Group.findById(request.groupId);
      if (!group) {
        throw new Error('Group not found');
      }

      const association = await Association.findById(group.communityId);
      if (!association) {
        throw new Error('Association not found');
      }

      // Get pending payments
      const payments = await DuesPayment.find({
        _id: { $in: request.paymentIds },
        memberId: request.memberId,
        status: { $in: ['pending', 'overdue'] }
      });

      if (payments.length === 0) {
        throw new Error('No valid payments found');
      }

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const reference = `dues_${Date.now()}_${request.memberId}`;

      // Initialize payment
      const paymentResult = await this.paymentService.initializePayment(association._id.toString(), {
        email: userEmail,
        amount: totalAmount * 100, // Convert to kobo
        currency: association.currency || 'NGN',
        reference,
        metadata: {
          groupId: request.groupId,
          memberId: request.memberId,
          paymentIds: request.paymentIds.join(','),
          type: 'group_dues',
          paymentCount: payments.length
        }
      });

      // Store payment reference
      await DuesPayment.updateMany(
        { _id: { $in: request.paymentIds } },
        { paystackReference: reference }
      );

      return {
        ...paymentResult,
        amount: totalAmount,
        payments: payments.map(p => ({
          id: p._id,
          period: p.period,
          amount: p.amount,
          dueDate: p.dueDate
        }))
      };

    } catch (error: any) {
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  // Process payment verification (webhook handler)
  async processPaymentVerification(reference: string, status: string, associationId: string): Promise<void> {
    try {
      if (status !== 'success') {
        return;
      }

      // Verify payment with Paystack
      const paymentData = await this.paymentService.verifyPayment(associationId, reference);
      
      if (paymentData.status === 'success') {
        // Update dues payments
        const updatedPayments = await DuesPayment.updateMany(
          { paystackReference: reference },
          {
            status: 'paid',
            paidDate: new Date(),
            paymentMethod: 'paystack',
            transactionId: paymentData.id
          }
        );

        // Send success notifications
        if (updatedPayments.modifiedCount > 0) {
          const payments = await DuesPayment.find({ paystackReference: reference });
          const groupId = payments[0]?.groupId;
          const memberId = payments[0]?.memberId;

          await this.notifyMember(memberId.toString(), 'DUES_PAYMENT_SUCCESS', {
            groupId: groupId.toString(),
            amount: paymentData.amount / 100,
            paymentCount: payments.length,
            reference
          });

          await this.notifyAdmin(groupId.toString(), 'MEMBER_DUES_PAID', {
            memberId: memberId.toString(),
            amount: paymentData.amount / 100,
            paymentCount: payments.length,
            reference
          });
        }
      }

    } catch (error: any) {
      console.error('Payment verification failed:', error);
      // Could implement dead letter queue here
    }
  }

  // Mark member dues as paid manually (admin only)
  async markMemberDuesPaid(paymentIds: string[], paidAmount: number, adminId: string, notes?: string): Promise<{ updatedCount: number; payments: any[] }> {
    try {
      const payments = await DuesPayment.find({
        _id: { $in: paymentIds },
        status: { $in: ['pending', 'overdue'] }
      });

      if (payments.length === 0) {
        throw new Error('No valid payments found');
      }

      const totalDueAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      
      // Validate paid amount
      if (paidAmount <= 0) {
        throw new Error('Paid amount must be greater than zero');
      }

      const updatedPayments = await DuesPayment.updateMany(
        { _id: { $in: paymentIds } },
        {
          status: 'paid',
          paidDate: new Date(),
          paymentMethod: 'manual',
          paidAmount: paidAmount,
          transactionId: notes || `manual_${Date.now()}`,
          processedBy: adminId
        }
      );

      // Send notifications
      const groupId = payments[0]?.groupId;
      const memberId = payments[0]?.memberId;

      await this.notifyMember(memberId.toString(), 'DUES_PAYMENT_SUCCESS', {
        groupId: groupId.toString(),
        paidAmount: paidAmount,
        dueAmount: totalDueAmount,
        paymentCount: payments.length,
        paymentMethod: 'manual'
      });

      return {
        updatedCount: updatedPayments.modifiedCount,
        payments: payments.map(p => ({
          id: p._id,
          period: p.period,
          amount: p.amount,
          paidAmount: paidAmount,
          memberId: p.memberId
        }))
      };

    } catch (error: any) {
      throw new Error(`Manual payment marking failed: ${error.message}`);
    }
  }

  // Private helper methods
  private calculateDueDate(frequency: string, dueDate: number): Date {
    const now = new Date();
    let targetDate = new Date();

    switch (frequency) {
      case 'weekly':
        const dayDiff = dueDate - now.getDay();
        targetDate.setDate(now.getDate() + dayDiff + (dayDiff <= 0 ? 7 : 0));
        break;
      case 'monthly':
        targetDate.setDate(dueDate);
        if (targetDate <= now) {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }
        break;
      case 'quarterly':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        targetDate = new Date(quarterStart.getTime() + (dueDate - 1) * 24 * 60 * 60 * 1000);
        if (targetDate <= now) {
          targetDate.setMonth(targetDate.getMonth() + 3);
        }
        break;
      case 'yearly':
        targetDate = new Date(now.getFullYear(), 0, dueDate);
        if (targetDate <= now) {
          targetDate.setFullYear(targetDate.getFullYear() + 1);
        }
        break;
    }

    return targetDate;
  }

  private async notifyAdmin(groupId: string, eventType: string, data: any): Promise<void> {
    try {
      await this.sns.publish({
        TopicArn: process.env.ADMIN_NOTIFICATIONS_TOPIC_ARN!,
        Message: JSON.stringify({
          eventType,
          groupId,
          data,
          timestamp: new Date().toISOString()
        }),
        MessageAttributes: {
          EventType: { StringValue: eventType, DataType: 'String' },
          GroupId: { StringValue: groupId, DataType: 'String' }
        }
      }).promise();
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }
  }

  private async notifyMember(memberId: string, eventType: string, data: any): Promise<void> {
    try {
      await this.sns.publish({
        TopicArn: process.env.MEMBER_NOTIFICATIONS_TOPIC_ARN!,
        Message: JSON.stringify({
          eventType,
          memberId,
          data,
          timestamp: new Date().toISOString()
        }),
        MessageAttributes: {
          EventType: { StringValue: eventType, DataType: 'String' },
          MemberId: { StringValue: memberId, DataType: 'String' }
        }
      }).promise();
    } catch (error) {
      console.error('Failed to send member notification:', error);
    }
  }

  private async triggerMemberNotifications(groupId: string, period: string): Promise<void> {
    await this.sqs.sendMessage({
      QueueUrl: process.env.MEMBER_NOTIFICATIONS_QUEUE_URL!,
      MessageBody: JSON.stringify({
        jobType: 'DUES_REMINDER',
        groupId,
        period,
        timestamp: new Date().toISOString()
      }),
      DelaySeconds: 300
    }).promise();
  }
}