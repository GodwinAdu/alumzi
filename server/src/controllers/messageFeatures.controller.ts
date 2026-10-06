import { Request, Response } from 'express';
import { MessageReaction, Bookmark, MessageRead } from '../models';

// Add reaction to message
export const addReaction = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user?.userId;

        const reaction = await MessageReaction.findOneAndUpdate(
            { messageId, userId, emoji },
            { messageId, userId, emoji },
            { upsert: true, new: true }
        );

        res.json({ message: 'Reaction added', reaction });
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({ message: 'Failed to add reaction' });
    }
};

// Remove reaction
export const removeReaction = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user?.userId;

        await MessageReaction.findOneAndDelete({ messageId, userId, emoji });

        res.json({ message: 'Reaction removed' });
    } catch (error) {
        console.error('Remove reaction error:', error);
        res.status(500).json({ message: 'Failed to remove reaction' });
    }
};

// Get message reactions
export const getMessageReactions = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;

        const reactions = await MessageReaction.find({ messageId })
            .populate('userId', 'name avatar');

        // Group by emoji
        const grouped = reactions.reduce((acc: any, r: any) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push({ userId: r.userId._id, name: r.userId.name, avatar: r.userId.avatar });
            return acc;
        }, {});

        res.json({ reactions: grouped });
    } catch (error) {
        console.error('Get reactions error:', error);
        res.status(500).json({ message: 'Failed to get reactions' });
    }
};

// Bookmark message
export const bookmarkMessage = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const { groupId, note } = req.body;
        const userId = req.user?.userId;

        const bookmark = await Bookmark.findOneAndUpdate(
            { userId, messageId },
            { userId, messageId, groupId, note },
            { upsert: true, new: true }
        );

        res.json({ message: 'Message bookmarked', bookmark });
    } catch (error) {
        console.error('Bookmark error:', error);
        res.status(500).json({ message: 'Failed to bookmark message' });
    }
};

// Remove bookmark
export const removeBookmark = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.userId;

        await Bookmark.findOneAndDelete({ userId, messageId });

        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        console.error('Remove bookmark error:', error);
        res.status(500).json({ message: 'Failed to remove bookmark' });
    }
};

// Get user bookmarks
export const getUserBookmarks = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        const bookmarks = await Bookmark.find({ userId })
            .populate('messageId')
            .populate('groupId', 'name')
            .sort({ createdAt: -1 });

        res.json({ bookmarks });
    } catch (error) {
        console.error('Get bookmarks error:', error);
        res.status(500).json({ message: 'Failed to get bookmarks' });
    }
};

// Mark message as read
export const markMessageRead = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        const userId = req.user?.userId;

        await MessageRead.findOneAndUpdate(
            { messageId, userId },
            { messageId, userId, readAt: new Date() },
            { upsert: true }
        );

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Failed to mark as read' });
    }
};

// Get message read receipts
export const getMessageReadReceipts = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;

        const reads = await MessageRead.find({ messageId })
            .populate('userId', 'name avatar')
            .sort({ readAt: -1 });

        res.json({ reads });
    } catch (error) {
        console.error('Get read receipts error:', error);
        res.status(500).json({ message: 'Failed to get read receipts' });
    }
};
