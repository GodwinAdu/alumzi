import { Request, Response } from 'express';
import { Group, GroupMember, Member } from '../models';

export const getGroupSettings = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can view settings' });
        }

        // Ensure settings have all required fields with defaults
        const settings = {
            isPublic: group.settings?.isPublic ?? true,
            requireApproval: group.settings?.requireApproval ?? false,
            onlyAdminsCanPost: group.settings?.onlyAdminsCanPost ?? false,
            allowMemberInvites: group.settings?.allowMemberInvites ?? true,
            showInCommunity: group.settings?.showInCommunity ?? true,
            financial: {
                allowMemberContributions: group.settings?.financial?.allowMemberContributions ?? true,
                requireReceiptUpload: group.settings?.financial?.requireReceiptUpload ?? false,
                autoApproveExpenses: group.settings?.financial?.autoApproveExpenses ?? false,
                expenseApprovalLimit: group.settings?.financial?.expenseApprovalLimit ?? 1000,
                autoApproveIncome: group.settings?.financial?.autoApproveIncome ?? true
            },
            notifications: {
                financialUpdates: group.settings?.notifications?.financialUpdates ?? true,
                incomeRecorded: group.settings?.notifications?.incomeRecorded ?? false,
                expenseRecorded: group.settings?.notifications?.expenseRecorded ?? false,
                newMembers: group.settings?.notifications?.newMembers ?? true,
                memberLeft: group.settings?.notifications?.memberLeft ?? false,
                monthlyReports: group.settings?.notifications?.monthlyReports ?? true
            },
            dues: {
                enabled: group.settings?.dues?.enabled ?? false,
                amount: group.settings?.dues?.amount ?? 0,
                frequency: group.settings?.dues?.frequency ?? 'monthly',
                dueDate: group.settings?.dues?.dueDate ?? 1,
                description: group.settings?.dues?.description ?? 'Group dues payment'
            },
            privacy: {
                showFinancials: group.settings?.privacy?.showFinancials ?? true,
                showMemberList: group.settings?.privacy?.showMemberList ?? true,
                allowDataExport: group.settings?.privacy?.allowDataExport ?? false
            }
        };

        res.status(200).json({ settings });
    } catch (error) {
        console.error('Get group settings error:', error);
        res.status(500).json({ message: 'Failed to get group settings' });
    }
};

export const updateGroupSettings = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { settings } = req.body;
        const userId = req.user?.userId;

        if (!settings) {
            return res.status(400).json({ message: 'Settings are required' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        const communityMember = await Member.findOne({ 
            userId, 
            associationId: group.communityId,
            role: { $in: ['admin', 'moderator'] }
        });

        if (!groupMember || (groupMember.role !== 'admin' && !communityMember)) {
            return res.status(403).json({ message: 'Only group admins or community admins can update settings' });
        }

        // Merge with existing settings to preserve any fields not being updated
        const updatedSettings = {
            ...group.settings,
            ...settings,
            financial: {
                ...group.settings?.financial,
                ...settings.financial
            },
            notifications: {
                ...group.settings?.notifications,
                ...settings.notifications
            },
            dues: {
                ...group.settings?.dues,
                ...settings.dues
            },
            privacy: {
                ...group.settings?.privacy,
                ...settings.privacy
            }
        };

        await Group.findByIdAndUpdate(groupId, { settings: updatedSettings }, { new: true });

        res.status(200).json({ message: 'Group settings updated successfully' });
    } catch (error) {
        console.error('Update group settings error:', error);
        res.status(500).json({ message: 'Failed to update group settings' });
    }
};

export const updateGroupInfo = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { name, description, avatar, banner } = req.body;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can update group info' });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (banner !== undefined) updateData.banner = banner;

        await Group.findByIdAndUpdate(groupId, updateData, { new: true });

        res.status(200).json({ message: 'Group info updated successfully' });
    } catch (error) {
        console.error('Update group info error:', error);
        res.status(500).json({ message: 'Failed to update group info' });
    }
};

export const addGroupMembers = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const { memberIds } = req.body;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can add members' });
        }

        // Validate and map memberIds to correct User/GuestMember IDs
        const registeredMembers = await Member.find({
            userId: { $in: memberIds },
            associationId: group.communityId
        });

        const { GuestMember } = require('../models');
        const guestMembers = await GuestMember.find({
            _id: { $in: memberIds },
            associationId: group.communityId
        });

        console.log('🔍 Adding members:', { 
            memberIds, 
            registeredCount: registeredMembers.length, 
            guestCount: guestMembers.length 
        });

        // Build map of memberIds to actual User/Guest IDs
        const memberIdMap = new Map<string, string>();
        registeredMembers.forEach(m => {
            memberIdMap.set(m.userId.toString(), m.userId.toString());
        });
        guestMembers.forEach((g: any) => {
            memberIdMap.set(g._id.toString(), g._id.toString());
        });

        if (memberIdMap.size !== memberIds.length) {
            return res.status(400).json({ message: 'All members must be part of the association first' });
        }

        // Create GroupMember records with correct IDs
        const newMembers = memberIds.map((memberId: string) => ({
            groupId,
            userId: memberIdMap.get(memberId),
            role: 'member',
            joinedAt: new Date()
        }));

        const result = await GroupMember.insertMany(newMembers, { ordered: false }).catch((err) => {
            console.log('⚠️ Insert error (some may be duplicates):', err.message);
            return { insertedCount: 0 };
        });
        
        console.log('✅ Members added to group:', result);
        await Group.findByIdAndUpdate(groupId, { $inc: { memberCount: memberIds.length } });

        res.status(200).json({ message: 'Members added successfully' });
    } catch (error) {
        console.error('Add group members error:', error);
        res.status(500).json({ message: 'Failed to add members' });
    }
};

export const removeGroupMember = async (req: Request, res: Response) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can remove members' });
        }

        await GroupMember.findOneAndDelete({ groupId, userId: memberId });
        await Group.findByIdAndUpdate(groupId, { $inc: { memberCount: -1 } });

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Remove group member error:', error);
        res.status(500).json({ message: 'Failed to remove member' });
    }
};

export const promoteToAdmin = async (req: Request, res: Response) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can promote members' });
        }

        await GroupMember.findOneAndUpdate({ groupId, userId: memberId }, { role: 'admin' });

        res.status(200).json({ message: 'Member promoted to admin' });
    } catch (error) {
        console.error('Promote to admin error:', error);
        res.status(500).json({ message: 'Failed to promote member' });
    }
};

export const demoteFromAdmin = async (req: Request, res: Response) => {
    try {
        const { groupId, memberId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can demote members' });
        }

        await GroupMember.findOneAndUpdate({ groupId, userId: memberId }, { role: 'member' });

        res.status(200).json({ message: 'Member demoted to member' });
    } catch (error) {
        console.error('Demote from admin error:', error);
        res.status(500).json({ message: 'Failed to demote member' });
    }
};
