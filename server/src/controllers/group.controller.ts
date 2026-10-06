import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Group, GroupMember, Member } from '../models';
import GroupJoinRequest from '../models/groupJoinRequest.models';

// Auto-join all community members to default groups
export const autoJoinDefaultGroups = async (userId: string, communityId: string) => {
    try {
        console.log(`🔍 Auto-joining user ${userId} to default groups in community ${communityId}`);
        
        const defaultGroups = await Group.find({ 
            communityId, 
            isDefault: true 
        });
        
        console.log(`📋 Found ${defaultGroups.length} default groups`);

        for (const group of defaultGroups) {
            const existing = await GroupMember.findOne({ 
                groupId: group._id, 
                userId 
            });

            if (!existing) {
                await GroupMember.create({
                    groupId: group._id,
                    userId,
                    role: 'member'
                });

                group.memberCount += 1;
                await group.save();
                
                console.log(`✅ Auto-joined user ${userId} to default group ${group.name}`);
            } else {
                console.log(`⏭️  User ${userId} already in group ${group.name}`);
            }
        }
    } catch (error) {
        console.error('Auto-join default groups error:', error);
    }
};

// Auto-create default groups when community is created
export const createDefaultGroups = async (communityId: string, createdBy: string) => {
    const defaultGroups = [
        {
            name: 'Announcements',
            description: 'Important updates and announcements',
            type: 'announcement',
            icon: '📢',
            isDefault: true,
            settings: {
                onlyAdminsCanPost: true,
                allowMemberInvites: false,
                showInCommunity: true
            }
        },
        {
            name: 'General',
            description: 'General discussions and community chat',
            type: 'general',
            icon: '💬',
            isDefault: true,
            settings: {
                onlyAdminsCanPost: false,
                allowMemberInvites: false,
                showInCommunity: true
            }
        }
    ];

    const createdGroups = [];
    for (const groupData of defaultGroups) {
        const group = new Group({
            communityId,
            ...groupData,
            createdBy
        });
        await group.save();
        createdGroups.push(group);
    }

    return createdGroups;
};

// Get all groups in a community
export const getCommunityGroups = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = req.user?.userId;

        // Check if user is member of community
        const member = await Member.findOne({ userId, associationId: communityId });
        if (!member) {
            return res.status(403).json({ message: 'Not a member of this community' });
        }

        const groups = await Group.find({ communityId, 'settings.showInCommunity': true })
            .sort({ type: 1, createdAt: 1 });

        // Get user's membership status for each group
        const groupsWithMembership = await Promise.all(groups.map(async (group) => {
            const groupMember = await GroupMember.findOne({ groupId: group._id, userId });
            
            // For default groups, return minimal info (chat-only)
            if (group.isDefault) {
                return {
                    id: group._id,
                    name: group.name,
                    description: group.description,
                    type: group.type,
                    icon: group.icon,
                    memberCount: group.memberCount,
                    isDefault: true,
                    isMember: !!groupMember,
                    isMuted: groupMember?.isMuted || false,
                    role: groupMember?.role
                };
            }
            
            // For custom groups, return full info including settings
            return {
                id: group._id,
                name: group.name,
                description: group.description,
                type: group.type,
                icon: group.icon,
                memberCount: group.memberCount,
                settings: group.settings,
                isDefault: false,
                isMember: !!groupMember,
                isMuted: groupMember?.isMuted || false,
                role: groupMember?.role
            };
        }));

        res.json({ groups: groupsWithMembership });
    } catch (error) {
        console.error('Get community groups error:', error);
        res.status(500).json({ message: 'Failed to get groups' });
    }
};

// Join a group (or request to join if approval required)
export const joinGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is member of community
        const member = await Member.findOne({ userId, associationId: group.communityId });
        if (!member) {
            return res.status(403).json({ message: 'Not a member of this community' });
        }

        // Check if already a member
        const existing = await GroupMember.findOne({ groupId, userId });
        if (existing) {
            return res.status(400).json({ message: 'Already a member of this group' });
        }

        // Check for existing pending request
        const existingRequest = await GroupJoinRequest.findOne({ groupId, userId, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'Join request already pending' });
        }

        // If group requires approval, create join request
        if (group.settings.requireApproval) {
            const joinRequest = new GroupJoinRequest({
                groupId,
                userId
            });
            await joinRequest.save();
            return res.json({ message: 'Join request sent. Waiting for admin approval', requiresApproval: true });
        }

        // Public group - join directly
        const groupMember = new GroupMember({
            groupId,
            userId,
            role: 'member'
        });
        await groupMember.save();

        group.memberCount += 1;
        await group.save();

        res.json({ message: 'Joined group successfully', requiresApproval: false });
    } catch (error) {
        console.error('Join group error:', error);
        res.status(500).json({ message: 'Failed to join group' });
    }
};

// Leave a group
export const leaveGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Can't leave default groups (announcement and general)
        if (group.type === 'announcement' || group.type === 'general') {
            return res.status(400).json({ message: 'Cannot leave default groups' });
        }

        const groupMember = await GroupMember.findOneAndDelete({ groupId, userId });
        if (!groupMember) {
            return res.status(400).json({ message: 'Not a member of this group' });
        }

        // Update member count
        group.memberCount = Math.max(0, group.memberCount - 1);
        await group.save();

        res.json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('Leave group error:', error);
        res.status(500).json({ message: 'Failed to leave group' });
    }
};

// Create custom group
export const createGroup = async (req: Request, res: Response) => {
    try {
        const { communityId, name, description, icon } = req.body;
        const userId = req.user?.userId;

        console.log('🔍 [Server] Create group request:', { communityId, name, userId });

        // Check if user is admin/moderator
        const member = await Member.findOne({ 
            userId, 
            associationId: communityId
        });
        
        console.log('👤 [Server] Member found:', member ? { role: member.role, status: member.status } : 'Not found');
        
        if (!member) {
            return res.status(403).json({ message: 'Not a member of this community' });
        }

        if (!['admin', 'moderator'].includes(member.role)) {
            return res.status(403).json({ message: 'Only admins and moderators can create groups' });
        }

        const group = new Group({
            communityId,
            name,
            description,
            icon,
            type: 'custom',
            createdBy: userId,
            settings: {
                onlyAdminsCanPost: false,
                allowMemberInvites: true,
                showInCommunity: true
            }
        });

        await group.save();
        console.log('✅ [Server] Group created:', group._id);

        // Auto-join creator as admin
        const groupMember = new GroupMember({
            groupId: group._id,
            userId,
            role: 'admin'
        });
        await groupMember.save();

        group.memberCount = 1;
        await group.save();

        res.json({ message: 'Group created successfully', group });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({ message: 'Failed to create group' });
    }
};

// Get pending join requests for a group (admin only)
export const getGroupJoinRequests = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is group admin
        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can view join requests' });
        }

        const requests = await GroupJoinRequest.find({ groupId, status: 'pending' })
            .populate('userId', 'name email phoneNumber avatar')
            .sort({ requestedAt: -1 });

        const requestList = requests.map(r => {
            const user = r.userId as any;
            return {
                id: r._id,
                userId: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                avatar: user.avatar,
                requestedAt: r.requestedAt
            };
        });

        res.json({ requests: requestList });
    } catch (error) {
        console.error('Get join requests error:', error);
        res.status(500).json({ message: 'Failed to get join requests' });
    }
};

// Approve join request
export const approveJoinRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const userId = req.user?.userId;

        const request = await GroupJoinRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        // Check if user is group admin
        const groupMember = await GroupMember.findOne({ groupId: request.groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can approve requests' });
        }

        // Add user to group
        const newMember = new GroupMember({
            groupId: request.groupId,
            userId: request.userId,
            role: 'member'
        });
        await newMember.save();

        // Update request status
        request.status = 'approved';
        request.processedAt = new Date();
        request.processedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
        await request.save();

        // Update member count
        const group = await Group.findById(request.groupId);
        if (group) {
            group.memberCount += 1;
            await group.save();
        }

        res.json({ message: 'Join request approved' });
    } catch (error) {
        console.error('Approve join request error:', error);
        res.status(500).json({ message: 'Failed to approve request' });
    }
};

// Reject join request
export const rejectJoinRequest = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const userId = req.user?.userId;

        const request = await GroupJoinRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        // Check if user is group admin
        const groupMember = await GroupMember.findOne({ groupId: request.groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only group admins can reject requests' });
        }

        request.status = 'rejected';
        request.processedAt = new Date();
        request.processedBy = userId ? new mongoose.Types.ObjectId(userId) : undefined;
        await request.save();

        res.json({ message: 'Join request rejected' });
    } catch (error) {
        console.error('Reject join request error:', error);
        res.status(500).json({ message: 'Failed to reject request' });
    }
};

// Get group members
export const getGroupMembers = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is member of community
        const member = await Member.findOne({ userId, associationId: group.communityId });
        if (!member) {
            return res.status(403).json({ message: 'Not a member of this community' });
        }

        // Check privacy settings - only admins can view member list if showMemberList is false
        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!group.settings?.privacy?.showMemberList && (!groupMember || groupMember.role !== 'admin')) {
            return res.status(403).json({ message: 'Only group admins can view the member list' });
        }

        const members = await GroupMember.find({ groupId })
            .sort({ joinedAt: -1 });

        console.log(`👥 Found ${members.length} group members for group ${groupId}`);
        members.forEach(m => console.log(`  - Member userId: ${m.userId}`));

        const { GuestMember } = require('../models');
        const { User } = require('../models');
        
        const memberList = await Promise.all(members.map(async (m) => {
            // Try to find as User first
            const user = await User.findById(m.userId);
            if (user) {
                console.log('✅ Registered member:', user.name);
                return {
                    id: m._id,
                    userId: user._id,
                    name: user.name,
                    role: m.role,
                    joinedAt: m.joinedAt,
                    isMuted: m.isMuted
                };
            }
            
            // Try to find as GuestMember
            const guestMember = await GuestMember.findById(m.userId);
            if (guestMember) {
                console.log('👤 Guest member:', guestMember.name);
                return {
                    id: m._id,
                    userId: guestMember._id,
                    name: guestMember.name,
                    role: m.role,
                    joinedAt: m.joinedAt,
                    isMuted: m.isMuted,
                    isGuest: true
                };
            }
            
            console.log('❌ Invalid member - userId:', m.userId);
            return null;
        }));

        const validMembers = memberList.filter(m => m !== null);
        console.log(`📊 Returning ${validMembers.length} valid members`);
        res.json({ members: validMembers });
    } catch (error) {
        console.error('Get group members error:', error);
        res.status(500).json({ message: 'Failed to get group members' });
    }
};
