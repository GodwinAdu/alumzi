import { Request, Response } from 'express';
import { BulkImportJob, Member, User, GuestMember, Association } from '../models';
import { broadcastMemberUpdate } from '../sockets';
import { autoJoinDefaultGroups } from './group.controller';

interface BulkMemberData {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
}

export const createBulkImportJob = async (req: Request, res: Response) => {
    try {
        const { associationId, members } = req.body;
        const userId = req.user?.userId;

        if (!associationId || !members || !Array.isArray(members)) {
            return res.status(400).json({ message: 'Association ID and members array required' });
        }

        const userMember = await Member.findOne({ 
            userId, 
            associationId,
            role: { $in: ['admin', 'moderator'] }
        });
        
        if (!userMember) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const job = new BulkImportJob({
            associationId,
            createdBy: userId,
            fileName: req.body.fileName || 'bulk-import.csv',
            totalRecords: members.length,
            status: 'pending'
        });

        await job.save();

        // Process in background
        processBulkImport(job._id.toString(), associationId, members, userId);

        res.json({ success: true, jobId: job._id });
    } catch (error) {
        console.error('Create bulk import error:', error);
        res.status(500).json({ message: 'Failed to create import job' });
    }
};

async function processBulkImport(jobId: string, associationId: string, members: BulkMemberData[], userId: string) {
    const job = await BulkImportJob.findById(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();

    const association = await Association.findById(associationId);
    const existingMembers = await Member.find({ associationId }).populate('userId', 'phoneNumber email');
    const existingGuests = await GuestMember.find({ associationId });

    const existingPhones = new Set(existingMembers.map(m => m.userId?.phoneNumber).filter(Boolean));
    const existingEmails = new Set(existingMembers.map(m => m.userId?.email).filter(Boolean));
    const existingGuestPhones = new Set(existingGuests.map(g => g.phoneNumber).filter(Boolean));
    const existingGuestEmails = new Set(existingGuests.map(g => g.email).filter(Boolean));

    for (let i = 0; i < members.length; i++) {
        const memberData = members[i];
        const row = i + 1;

        try {
            if (!memberData.name || (!memberData.email && !memberData.phone)) {
                job.results.push({
                    row,
                    name: memberData.name || 'Unknown',
                    email: memberData.email,
                    phone: memberData.phone,
                    status: 'failed',
                    message: 'Name and contact required'
                });
                job.failureCount++;
                continue;
            }

            const isDuplicate = (memberData.phone && (existingPhones.has(memberData.phone) || existingGuestPhones.has(memberData.phone))) ||
                               (memberData.email && (existingEmails.has(memberData.email) || existingGuestEmails.has(memberData.email)));

            if (isDuplicate) {
                job.results.push({
                    row,
                    name: memberData.name,
                    email: memberData.email,
                    phone: memberData.phone,
                    status: 'duplicate',
                    message: 'Already exists'
                });
                job.duplicateCount++;
                continue;
            }

            let user = null;
            if (memberData.phone) {
                user = await User.findOne({ phoneNumber: memberData.phone, status: { $ne: 'temporary' } });
            }
            if (!user && memberData.email) {
                user = await User.findOne({ email: memberData.email, status: { $ne: 'temporary' } });
            }

            if (user) {
                const member = new Member({
                    userId: user._id,
                    associationId,
                    status: 'active',
                    role: memberData.role || 'member'
                });
                await member.save();
                await autoJoinDefaultGroups(user._id.toString(), associationId);

                association?.members.push({
                    userId: user._id,
                    role: memberData.role || 'member',
                    joinedAt: new Date(),
                    isActive: true
                });

                job.results.push({
                    row,
                    name: memberData.name,
                    email: memberData.email,
                    phone: memberData.phone,
                    status: 'success',
                    memberId: member._id
                });
                job.successCount++;
            } else {
                const guestMember = new GuestMember({
                    associationId,
                    name: memberData.name,
                    email: memberData.email,
                    phoneNumber: memberData.phone,
                    role: memberData.role || 'member',
                    status: 'active',
                    addedBy: userId
                });
                await guestMember.save();

                job.results.push({
                    row,
                    name: memberData.name,
                    email: memberData.email,
                    phone: memberData.phone,
                    status: 'success',
                    memberId: guestMember._id
                });
                job.successCount++;
            }

            job.processedRecords++;
        } catch (error) {
            job.results.push({
                row,
                name: memberData.name,
                email: memberData.email,
                phone: memberData.phone,
                status: 'failed',
                message: 'Processing error'
            });
            job.failureCount++;
        }

        if (i % 10 === 0) {
            await job.save();
        }
    }

    await association?.save();
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    broadcastMemberUpdate(associationId, 'bulk_import_completed', {
        jobId: job._id,
        successCount: job.successCount,
        failureCount: job.failureCount
    });
}

export const getBulkImportJob = async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        const job = await BulkImportJob.findById(jobId);
        
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get job' });
    }
};

export const getBulkImportJobs = async (req: Request, res: Response) => {
    try {
        const { associationId } = req.params;
        const jobs = await BulkImportJob.find({ associationId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get jobs' });
    }
};
