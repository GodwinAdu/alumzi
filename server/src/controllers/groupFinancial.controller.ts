import { Request, Response } from 'express';
import { Income, Expense, Member, Group, GroupMember } from '../models';
import mongoose from 'mongoose';

export const getGroupFinancialSummary = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId: new mongoose.Types.ObjectId(userId) });
        if (!groupMember) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        // Check privacy settings - only admins can view if showFinancials is false
        if (!group.settings?.privacy?.showFinancials && groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can view financial data' });
        }

        const groupObjectId = new mongoose.Types.ObjectId(groupId);
        const [totalIncome, totalExpense, incomeCount, expenseCount] = await Promise.all([
            Income.aggregate([{ $match: { groupId: groupObjectId } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Expense.aggregate([{ $match: { groupId: groupObjectId, isApproved: true } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
            Income.countDocuments({ groupId: groupObjectId }),
            Expense.countDocuments({ groupId: groupObjectId })
        ]);

        const income = totalIncome[0]?.total || 0;
        const expense = totalExpense[0]?.total || 0;

        res.status(200).json({
            groupId: group._id,
            groupName: group.name,
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            incomeCount,
            expenseCount
        });
    } catch (error) {
        console.error('Get group financial summary error:', error);
        res.status(500).json({ message: 'Failed to get group financial summary' });
    }
};

export const getAllGroupsFinancialSummary = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = req.user?.userId;

        const member = await Member.findOne({ 
            userId, 
            associationId: communityId,
            role: { $in: ['admin', 'moderator'] }
        });
        if (!member) {
            return res.status(403).json({ message: 'Only admins can view consolidated finances' });
        }

        const groups = await Group.find({ communityId, isDefault: { $ne: true } });

        const groupFinancials = await Promise.all(groups.map(async (group) => {
            const [totalIncome, totalExpense] = await Promise.all([
                Income.aggregate([{ $match: { groupId: group._id } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
                Expense.aggregate([{ $match: { groupId: group._id, isApproved: true } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
            ]);

            const income = totalIncome[0]?.total || 0;
            const expense = totalExpense[0]?.total || 0;

            return {
                groupId: group._id,
                groupName: group.name,
                groupType: group.type,
                totalIncome: income,
                totalExpense: expense,
                balance: income - expense
            };
        }));

        // Filter out groups with no financial activity
        const activeGroupFinancials = groupFinancials.filter(g => 
            g.totalIncome > 0 || g.totalExpense > 0
        );

        const communityTotal = groupFinancials.reduce((acc, g) => ({
            totalIncome: acc.totalIncome + g.totalIncome,
            totalExpense: acc.totalExpense + g.totalExpense,
            balance: acc.balance + g.balance
        }), { totalIncome: 0, totalExpense: 0, balance: 0 });

        res.status(200).json({
            communityId,
            groups: activeGroupFinancials,
            communityTotal
        });
    } catch (error) {
        console.error('Get all groups financial summary error:', error);
        res.status(500).json({ message: 'Failed to get consolidated finances' });
    }
};
