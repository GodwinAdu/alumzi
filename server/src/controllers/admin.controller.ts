import { Request, Response } from 'express';
import { Association, User } from '../models';

// Get all associations for admin review
export const getAssociationsForReview = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, status = 'all', search = '' } = req.query;
        
        let query: any = {};
        
        if (status !== 'all') {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const associations = await Association.find(query)
            .populate('createdBy', 'name email')
            .populate('moderatedBy', 'name')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
            
        const total = await Association.countDocuments(query);
        
        res.json({
            associations,
            total,
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        console.error('Get associations for review error:', error);
        res.status(500).json({ message: 'Failed to get associations' });
    }
};

// Moderate association (approve, block, ban)
export const moderateAssociation = async (req: Request, res: Response) => {
    try {
        const { associationId } = req.params;
        const { status, reason } = req.body;
        const adminId = req.user?.userId;
        
        if (!['approved', 'blocked', 'banned'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        const association = await Association.findByIdAndUpdate(
            associationId,
            {
                status,
                moderationReason: reason,
                moderatedBy: adminId,
                moderatedAt: new Date(),
                isActive: status === 'approved'
            },
            { new: true }
        );
        
        if (!association) {
            return res.status(404).json({ message: 'Association not found' });
        }
        
        res.json({
            message: `Association ${status} successfully`,
            association
        });
    } catch (error) {
        console.error('Moderate association error:', error);
        res.status(500).json({ message: 'Failed to moderate association' });
    }
};

// Get association statistics for admin dashboard
export const getAssociationStats = async (req: Request, res: Response) => {
    try {
        const [total, approved, pending, blocked, banned] = await Promise.all([
            Association.countDocuments(),
            Association.countDocuments({ status: 'approved' }),
            Association.countDocuments({ status: 'pending' }),
            Association.countDocuments({ status: 'blocked' }),
            Association.countDocuments({ status: 'banned' })
        ]);
        
        res.json({
            total,
            approved,
            pending,
            blocked,
            banned
        });
    } catch (error) {
        console.error('Get association stats error:', error);
        res.status(500).json({ message: 'Failed to get statistics' });
    }
};