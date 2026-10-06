import { Request, Response } from 'express';
import DuesPayment from '../models/duesPayment.models';
import Group from '../models/group.models';
import Association from '../models/association.models';

// Get member's dues status for a group
export const getMemberDuesStatus = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const memberId = req.user?.userId;

        console.log('🔍 getMemberDuesStatus called:', { groupId, memberId });

        const group = await Group.findById(groupId);
        console.log('📊 Group found:', { 
            groupExists: !!group, 
            duesEnabled: group?.settings?.dues?.enabled,
            duesAmount: group?.settings?.dues?.amount,
            frequency: group?.settings?.dues?.frequency
        });

        if (!group || !group.settings.dues.enabled) {
            console.log('❌ Group not found or dues not enabled');
            return res.status(404).json({ message: 'Group not found or dues not enabled' });
        }

        // Auto-generate current period dues if none exist
        const currentDate = new Date();
        let currentPeriod: string;
        
        switch (group.settings.dues.frequency) {
            case 'weekly':
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                currentPeriod = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
                break;
            case 'monthly':
                currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'quarterly':
                const quarter = Math.ceil((currentDate.getMonth() + 1) / 3);
                currentPeriod = `${currentDate.getFullYear()}-Q${quarter}`;
                break;
            case 'yearly':
                currentPeriod = `${currentDate.getFullYear()}`;
                break;
            default:
                currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        }

        console.log('📅 Current period:', currentPeriod);

        // Check if current period dues exist for this member
        const existingCurrentDues = await DuesPayment.findOne({
            groupId,
            memberId,
            period: currentPeriod
        });

        if (!existingCurrentDues) {
            console.log('🔄 Auto-generating dues for current period');
            
            // Calculate due date
            const calculateDueDate = (frequency: string, dueDate: number): Date => {
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
                        targetDate.setDate(dueDate);
                        targetDate.setMonth(Math.floor(now.getMonth() / 3) * 3 + 3);
                        if (targetDate <= now) {
                            targetDate.setMonth(targetDate.getMonth() + 3);
                        }
                        break;
                    case 'yearly':
                        targetDate.setDate(dueDate);
                        targetDate.setMonth(0);
                        if (targetDate <= now) {
                            targetDate.setFullYear(targetDate.getFullYear() + 1);
                        }
                        break;
                }
                return targetDate;
            };

            const dueDate = calculateDueDate(group.settings.dues.frequency, group.settings.dues.dueDate || 1);
            
            // Create dues payment for current member
            await DuesPayment.create({
                groupId,
                memberId,
                amount: group.settings.dues.amount,
                period: currentPeriod,
                dueDate,
                status: 'pending'
            });

            console.log('✅ Auto-generated dues payment:', { period: currentPeriod, amount: group.settings.dues.amount });
        }

        const duesPayments = await DuesPayment.find({
            groupId,
            memberId
        }).sort({ dueDate: -1 });

        console.log('💰 Dues payments found:', { 
            totalPayments: duesPayments.length,
            payments: duesPayments.map(p => ({ 
                id: p._id, 
                status: p.status, 
                amount: p.amount, 
                period: p.period 
            }))
        });

        const pendingDues = duesPayments.filter(d => d.status === 'pending' || d.status === 'overdue');
        const totalOutstanding = pendingDues.reduce((sum, d) => sum + d.amount, 0);

        console.log('📋 Final response:', {
            pendingDuesCount: pendingDues.length,
            totalOutstanding,
            groupName: group.name
        });

        res.json({
            group: {
                name: group.name,
                duesAmount: group.settings.dues.amount,
                frequency: group.settings.dues.frequency,
                description: group.settings.dues.description
            },
            totalOutstanding,
            pendingDues: pendingDues.length,
            payments: duesPayments
        });
    } catch (error) {
        console.error('❌ getMemberDuesStatus error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get specific member's dues status (admin only)
export const getMemberDuesForAdmin = async (req: Request, res: Response) => {
    try {
        const { groupId, memberId } = req.params;
        
        const group = await Group.findById(groupId);
        if (!group || !group.settings.dues.enabled) {
            return res.status(404).json({ message: 'Group not found or dues not enabled' });
        }

        const duesPayments = await DuesPayment.find({
            groupId,
            memberId
        }).sort({ dueDate: -1 });

        const pendingDues = duesPayments.filter(d => d.status === 'pending' || d.status === 'overdue');
        const totalOutstanding = pendingDues.reduce((sum, d) => sum + d.amount, 0);

        res.json({
            memberId,
            totalOutstanding,
            pendingDues: pendingDues.length,
            payments: duesPayments
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get all group dues status (admin only)
export const getGroupDuesStatus = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const duesPayments = await DuesPayment.find({ groupId })
            .populate('memberId', 'firstName lastName email')
            .sort({ dueDate: -1 });

        const summary = {
            totalMembers: await DuesPayment.distinct('memberId', { groupId }).then(ids => ids.length),
            totalOutstanding: duesPayments
                .filter(d => d.status !== 'paid')
                .reduce((sum, d) => sum + d.amount, 0),
            totalCollected: duesPayments
                .filter(d => d.status === 'paid')
                .reduce((sum, d) => sum + d.amount, 0),
            pendingCount: duesPayments.filter(d => d.status === 'pending').length,
            overdueCount: duesPayments.filter(d => d.status === 'overdue').length
        };

        res.json({
            summary,
            payments: duesPayments
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Initialize Paystack payment
export const initializePayment = async (req: Request, res: Response) => {
    try {
        const { groupId, paymentIds } = req.body;
        const memberId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const association = await Association.findById(group.communityId);
        if (!association?.paymentSettings?.paystack?.enabled) {
            return res.status(400).json({ message: 'Paystack not configured for this association' });
        }

        const payments = await DuesPayment.find({
            _id: { $in: paymentIds },
            memberId,
            status: { $in: ['pending', 'overdue'] }
        });

        if (payments.length === 0) {
            return res.status(400).json({ message: 'No valid payments found' });
        }

        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Initialize Paystack payment
        const paystackData = {
            email: (req.user as any)?.email,
            amount: totalAmount * 100, // Paystack expects amount in kobo
            currency: association.currency || 'NGN',
            reference: `dues_${Date.now()}_${memberId}`,
            metadata: {
                groupId,
                memberId,
                paymentIds: paymentIds.join(','),
                type: 'group_dues'
            }
        };

        // Here you would integrate with Paystack API
        // For now, returning mock response
        res.json({
            authorization_url: `https://checkout.paystack.com/mock/${paystackData.reference}`,
            access_code: 'mock_access_code',
            reference: paystackData.reference,
            amount: totalAmount,
            payments: payments.map(p => ({
                id: p._id,
                period: p.period,
                amount: p.amount,
                dueDate: p.dueDate
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Verify payment (webhook or manual)
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { reference, status } = req.body;

        if (status === 'success') {
            // Extract metadata from reference
            const [, timestamp, memberId] = reference.split('_');
            
            // Find pending payments for this reference
            const payments = await DuesPayment.find({
                memberId,
                status: { $in: ['pending', 'overdue'] }
            });

            // Mark payments as paid
            await DuesPayment.updateMany(
                { _id: { $in: payments.map(p => p._id) } },
                {
                    status: 'paid',
                    paidDate: new Date(),
                    paymentMethod: 'paystack',
                    paystackReference: reference
                }
            );

            res.json({ message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ message: 'Payment verification failed' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Mark payment as paid manually (admin only)
export const markPaymentPaid = async (req: Request, res: Response) => {
    try {
        const { paymentId } = req.params;
        const { paymentMethod = 'manual', notes } = req.body;

        const payment = await DuesPayment.findByIdAndUpdate(
            paymentId,
            {
                status: 'paid',
                paidDate: new Date(),
                paymentMethod,
                transactionId: notes
            },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({ message: 'Payment marked as paid', payment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Generate dues for a period (admin only)
export const generateDues = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { period } = req.body;

        const group = await Group.findById(groupId).populate('communityId');
        if (!group || !group.settings.dues.enabled) {
            return res.status(404).json({ message: 'Group not found or dues not enabled' });
        }

        // Get all group members
        const association = await Association.findById(group.communityId);
        const groupMembers = association?.members.filter((m: any) => m.isActive) || [];

        const dueDate = calculateDueDate(group.settings.dues.frequency, group.settings.dues.dueDate);
        
        const duesPayments = [];
        for (const member of groupMembers) {
            // Check if dues already exist for this period
            const existingDues = await DuesPayment.findOne({
                groupId,
                memberId: member.userId,
                period
            });

            if (!existingDues) {
                duesPayments.push({
                    groupId,
                    memberId: member.userId,
                    amount: group.settings.dues.amount,
                    period,
                    dueDate,
                    status: 'pending'
                });
            }
        }

        if (duesPayments.length > 0) {
            await DuesPayment.insertMany(duesPayments);
        }

        res.json({
            message: `Generated dues for ${duesPayments.length} members`,
            period,
            amount: group.settings.dues.amount,
            dueDate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Helper function to calculate due date
function calculateDueDate(frequency: string, dueDate: number): Date {
    const now = new Date();
    let targetDate = new Date();

    switch (frequency) {
        case 'weekly':
            // dueDate is day of week (1=Monday, 7=Sunday)
            const dayDiff = dueDate - now.getDay();
            targetDate.setDate(now.getDate() + dayDiff + (dayDiff <= 0 ? 7 : 0));
            break;
        case 'monthly':
            // dueDate is day of month
            targetDate.setDate(dueDate);
            if (targetDate <= now) {
                targetDate.setMonth(targetDate.getMonth() + 1);
            }
            break;
        case 'quarterly':
            // dueDate is day of quarter
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            targetDate = new Date(quarterStart.getTime() + (dueDate - 1) * 24 * 60 * 60 * 1000);
            if (targetDate <= now) {
                targetDate.setMonth(targetDate.getMonth() + 3);
            }
            break;
        case 'yearly':
            // dueDate is day of year
            targetDate = new Date(now.getFullYear(), 0, dueDate);
            if (targetDate <= now) {
                targetDate.setFullYear(targetDate.getFullYear() + 1);
            }
            break;
    }

    return targetDate;
}