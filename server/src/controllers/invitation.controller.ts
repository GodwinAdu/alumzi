import { Request, Response } from 'express';
import { Invitation, Member, Association } from '../models';
import crypto from 'crypto';

export const createInvitations = async (req: Request, res: Response) => {
    try {
        const { associationId, invitations } = req.body;
        const userId = req.user?.userId;

        if (!associationId || !invitations || !Array.isArray(invitations)) {
            return res.status(400).json({ message: 'Association ID and invitations array required' });
        }

        const userMember = await Member.findOne({ 
            userId, 
            associationId,
            role: { $in: ['admin', 'moderator'] }
        });
        
        if (!userMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const createdInvitations = [];

        for (const inv of invitations) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            const invitation = new Invitation({
                associationId,
                invitedBy: userId,
                inviteeEmail: inv.email,
                inviteePhone: inv.phone,
                inviteeName: inv.name,
                invitationCode: code,
                expiresAt,
                metadata: {
                    source: inv.method || 'email',
                    sentAt: new Date()
                }
            });

            await invitation.save();
            createdInvitations.push(invitation);
        }

        res.json({ success: true, invitations: createdInvitations });
    } catch (error) {
        console.error('Create invitations error:', error);
        res.status(500).json({ message: 'Failed to create invitations' });
    }
};

export const getInvitations = async (req: Request, res: Response) => {
    try {
        const { associationId } = req.params;
        const { status } = req.query;

        const query: any = { associationId };
        if (status) query.status = status;

        const invitations = await Invitation.find(query)
            .populate('invitedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, invitations });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get invitations' });
    }
};

export const acceptInvitation = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const userId = req.user?.userId;

        const invitation = await Invitation.findOne({ 
            invitationCode: code,
            status: 'pending'
        });

        if (!invitation) {
            return res.status(404).json({ message: 'Invalid or expired invitation' });
        }

        if (new Date() > invitation.expiresAt) {
            invitation.status = 'expired';
            await invitation.save();
            return res.status(400).json({ message: 'Invitation expired' });
        }

        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        invitation.acceptedBy = userId;
        await invitation.save();

        res.json({ success: true, associationId: invitation.associationId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to accept invitation' });
    }
};

export const cancelInvitation = async (req: Request, res: Response) => {
    try {
        const { invitationId } = req.params;
        const userId = req.user?.userId;

        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found' });
        }

        const userMember = await Member.findOne({ 
            userId, 
            associationId: invitation.associationId,
            role: { $in: ['admin', 'moderator'] }
        });
        
        if (!userMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        invitation.status = 'cancelled';
        await invitation.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel invitation' });
    }
};
