import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { DuesManagementService } from '../services/duesManagement.service';
import { PaymentSecurityService } from '../services/paymentSecurity.service';
import DuesPayment from '../models/duesPayment.models';
import Group from '../models/group.models';
import { CloudWatch } from 'aws-sdk';
import crypto from 'crypto';

export class EnterpriseDuesController {
  private duesService: DuesManagementService;
  private securityService: PaymentSecurityService;
  private cloudWatch: CloudWatch;

  constructor() {
    this.duesService = new DuesManagementService();
    this.securityService = new PaymentSecurityService();
    this.cloudWatch = new CloudWatch({ region: process.env.AWS_REGION });
  }

  // Validation middleware
  static validateGenerateDues = [
    param('groupId').isMongoId().withMessage('Invalid group ID'),
    body('period').isString().isLength({ min: 1, max: 20 }).withMessage('Period is required'),
    body('period').matches(/^\d{4}-(Q[1-4]|W\d{2}|\d{2})$/).withMessage('Invalid period format')
  ];

  static validateInitializePayment = [
    body('groupId').isMongoId().withMessage('Invalid group ID'),
    body('paymentIds').isArray({ min: 1 }).withMessage('Payment IDs are required'),
    body('paymentIds.*').isMongoId().withMessage('Invalid payment ID format')
  ];

  static validateMemberDuesStatus = [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ];

  static validateMarkDuesPaid = [
    body('paymentIds').isArray({ min: 1 }).withMessage('Payment IDs are required'),
    body('paymentIds.*').isMongoId().withMessage('Invalid payment ID format'),
    body('paidAmount').isNumeric().isFloat({ min: 0.01 }).withMessage('Paid amount must be a positive number'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ];

  // Get member's dues status with caching
  getMemberDuesStatus = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { groupId } = req.params;
      const memberId = req.user?.userId;

      if (!memberId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check group and dues settings
      const group = await Group.findById(groupId);
      if (!group || !group.settings.dues.enabled) {
        res.status(404).json({
          success: false,
          message: 'Group not found or dues not enabled'
        });
        return;
      }

      // Get member's dues with aggregation for better performance
      const duesAggregation = await DuesPayment.aggregate([
        { $match: { groupId: group._id, memberId } },
        {
          $group: {
            _id: null,
            totalOutstanding: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['pending', 'overdue']] },
                  '$amount',
                  0
                ]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['pending', 'overdue']] },
                  1,
                  0
                ]
              }
            },
            payments: { $push: '$$ROOT' }
          }
        }
      ]);

      const result = duesAggregation[0] || {
        totalOutstanding: 0,
        pendingCount: 0,
        payments: []
      };

      // Update overdue status
      await this.updateOverduePayments(groupId, memberId);

      // Record metrics
      await this.recordMetric('DuesStatusRequest', 'Success', 1);
      await this.recordMetric('DuesStatusLatency', 'Milliseconds', Date.now() - startTime);

      res.json({
        success: true,
        data: {
          group: {
            name: group.name,
            duesAmount: group.settings.dues.amount,
            frequency: group.settings.dues.frequency,
            description: group.settings.dues.description
          },
          totalOutstanding: result.totalOutstanding,
          pendingDues: result.pendingCount,
          payments: result.payments.sort((a: any, b: any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
        }
      });

    } catch (error: any) {
      await this.recordMetric('DuesStatusRequest', 'Error', 1);
      await this.handleError(res, error, 'Failed to get dues status');
    }
  };

  // Initialize payment with enterprise patterns
  initializePayment = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { groupId, paymentIds } = req.body;
      const memberId = req.user?.userId;
      const userEmail = (req.user as any)?.email;

      if (!memberId || !userEmail) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Rate limiting check
      const rateLimitKey = `payment_init_${memberId}`;
      const recentAttempts = await this.checkRateLimit(rateLimitKey, 5, 300); // 5 attempts per 5 minutes
      
      if (recentAttempts >= 5) {
        res.status(429).json({
          success: false,
          message: 'Too many payment attempts. Please try again later.'
        });
        return;
      }

      // Initialize payment
      const paymentResult = await this.duesService.initializeMemberPayment(
        { groupId, memberId, paymentIds },
        userEmail
      );

      // Record metrics
      await this.recordMetric('PaymentInitialization', 'Success', 1);
      await this.recordMetric('PaymentInitializationLatency', 'Milliseconds', Date.now() - startTime);

      res.json({
        success: true,
        data: paymentResult
      });

    } catch (error: any) {
      await this.recordMetric('PaymentInitialization', 'Error', 1);
      await this.handleError(res, error, 'Failed to initialize payment');
    }
  };

  // Generate dues (admin only)
  generateDues = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { groupId } = req.params;
      const { period } = req.body;
      const initiatedBy = req.user?.userId;

      if (!initiatedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check for duplicate generation
      const existingDues = await DuesPayment.findOne({ groupId, period });
      if (existingDues) {
        res.status(409).json({
          success: false,
          message: 'Dues already generated for this period'
        });
        return;
      }

      // Generate dues asynchronously
      const result = await this.duesService.generateGroupDues({
        groupId,
        period,
        initiatedBy
      });

      // Record metrics
      await this.recordMetric('DuesGeneration', 'Success', 1);
      await this.recordMetric('DuesGenerationLatency', 'Milliseconds', Date.now() - startTime);

      res.json({
        success: true,
        message: 'Dues generation started',
        data: result
      });

    } catch (error: any) {
      await this.recordMetric('DuesGeneration', 'Error', 1);
      await this.handleError(res, error, 'Failed to generate dues');
    }
  };

  // Webhook handler for payment verification
  verifyPaymentWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signatureHeader = req.headers['x-paystack-signature'];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader as string;
      const payload = JSON.stringify(req.body);
      
      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Missing signature'
        });
        return;
      }

      // Extract association ID from webhook data
      const { data } = req.body;
      const associationId = data?.metadata?.associationId;
      
      if (!associationId) {
        res.status(400).json({
          success: false,
          message: 'Missing association ID'
        });
        return;
      }

      // Verify webhook signature
      const credentials = await this.securityService.getCredentials(associationId);
      if (!credentials?.webhookSecret) {
        res.status(500).json({
          success: false,
          message: 'Webhook secret not configured'
        });
        return;
      }

      const expectedSignature = crypto.createHmac('sha512', credentials.webhookSecret)
        .update(payload)
        .digest('hex');
      
      const isValidSignature = (signature as string) === expectedSignature;

      if (!isValidSignature) {
        res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
        return;
      }

      // Process payment verification
      await this.duesService.processPaymentVerification(
        data.reference,
        data.status,
        associationId
      );

      await this.recordMetric('WebhookProcessing', 'Success', 1);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error: any) {
      await this.recordMetric('WebhookProcessing', 'Error', 1);
      await this.handleError(res, error, 'Webhook processing failed');
    }
  };

  // Mark member dues as paid manually (admin only)
  markDuesPaid = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { paymentIds, paidAmount, notes } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.duesService.markMemberDuesPaid(paymentIds, paidAmount, adminId, notes);

      await this.recordMetric('ManualDuesPayment', 'Success', 1);
      await this.recordMetric('ManualDuesPaymentLatency', 'Milliseconds', Date.now() - startTime);

      res.json({
        success: true,
        message: `Marked ${result.updatedCount} payments as paid`,
        data: result
      });

    } catch (error: any) {
      await this.recordMetric('ManualDuesPayment', 'Error', 1);
      await this.handleError(res, error, 'Failed to mark dues as paid');
    }
  };

  // Private helper methods
  private async updateOverduePayments(groupId: string, memberId: string): Promise<void> {
    await DuesPayment.updateMany(
      {
        groupId,
        memberId,
        status: 'pending',
        dueDate: { $lt: new Date() }
      },
      { status: 'overdue' }
    );
  }

  private async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<number> {
    // Implementation would use Redis or similar for distributed rate limiting
    // For now, return 0 (no rate limiting)
    return 0;
  }

  private async recordMetric(metricName: string, unit: string, value: number): Promise<void> {
    try {
      await this.cloudWatch.putMetricData({
        Namespace: 'Alumzi/Dues',
        MetricData: [{
          MetricName: metricName,
          Unit: unit as any,
          Value: value,
          Timestamp: new Date(),
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.NODE_ENV || 'development'
            }
          ]
        }]
      }).promise();
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }

  private async handleError(res: Response, error: any, defaultMessage: string): Promise<void> {
    console.error('Controller error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || defaultMessage;
    
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}