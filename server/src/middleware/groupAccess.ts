import { Request, Response, NextFunction } from 'express';
import { GroupMember, Group, Member } from '../models';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            group?: any;
            groupMember?: any;
        }
    }
}

export const requireGroupMembership = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is member of the community
        const communityMember = await Member.findOne({ 
            userId, 
            associationId: group.communityId 
        });
        
        if (!communityMember) {
            return res.status(403).json({ message: 'Not a member of this community' });
        }

        // For default groups, community membership is enough
        if (group.isDefault) {
            req.group = group;
            req.groupMember = { role: 'member', isMember: true };
            return next();
        }

        // For custom groups, check group membership
        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember) {
            return res.status(403).json({ message: 'Not a member of this group. Please join the group first.' });
        }

        req.group = group;
        req.groupMember = groupMember;
        next();
    } catch (error) {
        console.error('Group access check error:', error);
        res.status(500).json({ message: 'Access check failed' });
    }
};

export const requireGroupAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // For default groups, check community admin role
        if (group.isDefault) {
            const communityMember = await Member.findOne({ 
                userId, 
                associationId: group.communityId,
                role: { $in: ['admin', 'moderator'] }
            });
            
            if (!communityMember) {
                return res.status(403).json({ message: 'Admin access required' });
            }
            
            return next();
        }

        // For custom groups, check group admin role
        const groupMember = await GroupMember.findOne({ groupId, userId });
        if (!groupMember || groupMember.role !== 'admin') {
            return res.status(403).json({ message: 'Group admin access required' });
        }

        next();
    } catch (error) {
        console.error('Group admin check error:', error);
        res.status(500).json({ message: 'Access check failed' });
    }
};

export const canPostInGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if only admins can post
        if (group.settings.onlyAdminsCanPost) {
            const groupMember = await GroupMember.findOne({ groupId, userId });
            
            if (!groupMember || groupMember.role !== 'admin') {
                return res.status(403).json({ message: 'Only admins can post in this group' });
            }
        }

        next();
    } catch (error) {
        console.error('Post permission check error:', error);
        res.status(500).json({ message: 'Permission check failed' });
    }
};
