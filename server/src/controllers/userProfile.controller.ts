import { Request, Response } from 'express';
import { User } from '../models';

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { name, bio, avatar } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-otp -otpExpires -twoFactor.secret -twoFactor.backupCodes');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-otp -otpExpires -twoFactor.secret -twoFactor.backupCodes');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Failed to get profile' });
    }
};

// Update online status
export const updateOnlineStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { isOnline } = req.body;

        const updateData: any = { isOnline };
        if (!isOnline) {
            updateData.lastSeen = new Date();
        }

        await User.findByIdAndUpdate(userId, updateData);

        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Failed to update status' });
    }
};

// Global search
export const globalSearch = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const userId = req.user?.userId;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query required' });
        }

        const searchRegex = new RegExp(query, 'i');

        // Search users
        const users = await User.find({
            _id: { $ne: userId },
            $or: [
                { name: searchRegex },
                { email: searchRegex }
            ]
        })
        .select('name email avatar bio isOnline')
        .limit(10);

        res.json({ users });
    } catch (error) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Search failed' });
    }
};

// Check if contacts are registered
export const checkRegisteredContacts = async (req: Request, res: Response) => {
    try {
        const { phoneNumbers, emails } = req.body;

        const registeredUsers = await User.find({
            $or: [
                { phoneNumber: { $in: phoneNumbers || [] } },
                { email: { $in: emails || [] } }
            ]
        }).select('_id name email phoneNumber avatar');

        res.json({ users: registeredUsers });
    } catch (error) {
        console.error('Check registered contacts error:', error);
        res.status(500).json({ message: 'Failed to check contacts' });
    }
};
