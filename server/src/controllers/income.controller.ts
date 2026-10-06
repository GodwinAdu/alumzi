import { Request, Response } from 'express';
import { Income, Member, IncomeType, Group } from '../models';
import { sendAssociationNotification } from './notification.controller';
import { broadcastFinancialUpdate, broadcastDashboardUpdate } from '../sockets';

export const createIncome = async (req: Request, res: Response) => {
    try {
        const { associationId, groupId, incomeTypeId, amount, description, source, sourceMember, paymentMethod, type } = req.body;
        const userId = req.user?.userId;

        if (!associationId || !incomeTypeId || !amount || !description) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        // Check group settings for member contributions
        let canCreateIncome = false;
        if (groupId) {
            const group = await Group.findById(groupId);
            if (group?.settings?.financial?.allowMemberContributions) {
                // Any group member can create income
                const member = await Member.findOne({ userId, associationId });
                canCreateIncome = !!member;
            } else {
                // Only admins can create income
                const member = await Member.findOne({ 
                    userId, 
                    associationId,
                    role: { $in: ['admin', 'moderator'] }
                });
                canCreateIncome = !!member;
            }
        } else {
            // Association-level income, only admins
            const member = await Member.findOne({ 
                userId, 
                associationId,
                role: { $in: ['admin', 'moderator'] }
            });
            canCreateIncome = !!member;
        }

        if (!canCreateIncome) {
            return res.status(403).json({ message: 'You do not have permission to record income for this group' });
        }

        const member = await Member.findOne({ userId, associationId });

        // Try to find income type by ID or name
        let incomeType;
        if (incomeTypeId.match(/^[0-9a-fA-F]{24}$/)) {
            // Valid ObjectId format
            incomeType = await IncomeType.findOne({ _id: incomeTypeId, associationId });
        }
        if (!incomeType) {
            // Try by name (case-insensitive)
            incomeType = await IncomeType.findOne({ 
                name: { $regex: new RegExp(`^${incomeTypeId}$`, 'i') }, 
               associationId 
            });
        }
        if (!incomeType) {
            // Create default income type if it doesn't exist
            incomeType = await IncomeType.create({
                associationId,
                name: incomeTypeId.charAt(0).toUpperCase() + incomeTypeId.slice(1),
                description: `Auto-created ${incomeTypeId} income type`,
                isDefault: true,
                createdBy: userId
            });
        }

        // Check if income should be auto-approved based on group settings
        let isVerified = true; // Default to verified
        if (groupId) {
            const group = await Group.findById(groupId);
            if (group && !group.settings?.financial?.autoApproveIncome) {
                isVerified = false;
            }
        }

        const income = new Income({
            associationId,
            groupId,
            type: type || 'other',
            category: incomeType.name,
            amount: parseFloat(amount),
            description,
            source,
            sourceMember,
            paymentMethod,
            recordedBy: userId,
            isVerified
        });

        await income.save();

        await sendAssociationNotification(
            associationId,
            'income_recorded',
            'New Income Recorded',
            `${member.userId.name} recorded income of $${amount} for ${incomeType.name}`,
            { incomeId: income._id, amount, category: incomeType.name },
            userId
        );
        
        // Broadcast real-time financial update
        broadcastFinancialUpdate(associationId, 'income', {
            id: income._id,
            amount: income.amount,
            category: incomeType.name,
            description: income.description,
            recordedBy: member.userId.name,
            date: income.date
        });
        
        // Broadcast dashboard update
        broadcastDashboardUpdate(associationId, {
            type: 'income_added',
            amount: income.amount
        });

        res.status(201).json({
            message: 'Income recorded successfully',
            income: {
                id: income._id,
                category: incomeType.name,
                amount: income.amount,
                description: income.description,
                date: income.date
            }
        });
    } catch (error) {
        console.error('Create income error:', error);
        res.status(500).json({ message: 'Failed to record income' });
    }
};

export const getIncomes = async (req: Request, res: Response) => {
    try {
        const { associationId } = req.params;
        const userId = req.user?.userId;
        const { page = 1, limit = 20, groupId } = req.query;

        const member = await Member.findOne({ userId, associationId });
        if (!member) {
            return res.status(403).json({ message: 'Not a member of this association' });
        }

        const query: any = { associationId };
        if (groupId) query.groupId = groupId;

        const incomes = await Income.find(query)
            .populate('recordedBy', 'name')
            .populate({
                path: 'sourceMember',
                populate: {
                    path: 'userId',
                    select: 'name'
                }
            })
            .sort({ date: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await Income.countDocuments(query);

        res.status(200).json({
            incomes: incomes.map(income => ({
                id: income._id,
                type: income.type,
                category: income.category,
                amount: income.amount,
                description: income.description,
                source: income.source,
                sourceMember: income.sourceMember ? {
                    id: income.sourceMember._id,
                    name: income.sourceMember.userId?.name
                } : null,
                paymentMethod: income.paymentMethod,
                recordedBy: income.recordedBy.name,
                date: income.date,
                isApproved: income.isVerified
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        console.error('Get incomes error:', error);
        res.status(500).json({ message: 'Failed to get incomes' });
    }
};

export const updateIncome = async (req: Request, res: Response) => {
    try {
        const { incomeId } = req.params;
        const { incomeTypeId, amount, description, source, sourceMember, paymentMethod, type } = req.body;
        const userId = req.user?.userId;
        
        console.log('Update income request:', { incomeId, incomeTypeId, amount, description, source, sourceMember, paymentMethod, type });

        const income = await Income.findById(incomeId);
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        const member = await Member.findOne({ 
            userId, 
            associationId: income.associationId,
            $or: [
                { role: { $in: ['admin', 'moderator'] } },
                { userId: income.recordedBy }
            ]
        });

        if (!member) {
            return res.status(403).json({ message: 'Not authorized to update this income' });
        }

        const updateData: any = {};
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (description !== undefined) updateData.description = description;
        if (source !== undefined) updateData.source = source;
        if (sourceMember !== undefined) updateData.sourceMember = sourceMember;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (type !== undefined) updateData.type = type;
        
        if (incomeTypeId !== undefined) {
            console.log('Looking up income type:', incomeTypeId);
            const incomeType = await IncomeType.findById(incomeTypeId);
            console.log('Found income type:', incomeType);
            if (incomeType) {
                updateData.category = incomeType.name;
                console.log('Updated category to:', incomeType.name);
            } else {
                console.log('Income type not found for ID:', incomeTypeId);
            }
        }

        console.log('Final update data:', updateData);
        const updatedIncome = await Income.findByIdAndUpdate(incomeId, updateData, { new: true });
        console.log('Updated income:', updatedIncome);

        res.status(200).json({ message: 'Income updated successfully' });
    } catch (error) {
        console.error('Update income error:', error);
        res.status(500).json({ message: 'Failed to update income' });
    }
};

export const approveIncome = async (req: Request, res: Response) => {
    try {
        const { incomeId } = req.params;
        const userId = req.user?.userId;

        const income = await Income.findById(incomeId);
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        const member = await Member.findOne({ 
            userId, 
            associationId: income.associationId,
            role: { $in: ['admin', 'moderator'] }
        });

        if (!member) {
            return res.status(403).json({ message: 'Only admins and moderators can approve income' });
        }

        await Income.findByIdAndUpdate(incomeId, { isVerified: true });

        res.status(200).json({ message: 'Income approved successfully' });
    } catch (error) {
        console.error('Approve income error:', error);
        res.status(500).json({ message: 'Failed to approve income' });
    }
};

export const deleteIncome = async (req: Request, res: Response) => {
    try {
        const { incomeId } = req.params;
        const userId = req.user?.userId;

        const income = await Income.findById(incomeId);
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        const member = await Member.findOne({ 
            userId, 
            associationId: income.associationId,
            $or: [
                { role: { $in: ['admin', 'moderator'] } },
                { userId: income.recordedBy }
            ]
        });

        if (!member) {
            return res.status(403).json({ message: 'Not authorized to delete this income' });
        }

        await Income.findByIdAndDelete(incomeId);

        res.status(200).json({ message: 'Income deleted successfully' });
    } catch (error) {
        console.error('Delete income error:', error);
        res.status(500).json({ message: 'Failed to delete income' });
    }
};