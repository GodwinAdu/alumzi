import { Request, Response } from 'express';
import Announcement from '../models/announcement.models';
import Group from '../models/group.models';
import GroupMember from '../models/groupMember.models';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { title, content, isPinned } = req.body;
    const userId = req.user?.userId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = await GroupMember.findOne({ groupId, userId, status: 'active' });
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create announcements' });
    }

    const announcement = await Announcement.create({
      groupId,
      communityId: group.communityId,
      title,
      content,
      createdBy: userId,
      isPinned: isPinned || false
    });

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name avatar');
    res.status(201).json({ announcement: populated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupAnnouncements = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const announcements = await Announcement.find({ groupId })
      .populate('createdBy', 'name avatar')
      .sort({ isPinned: -1, createdAt: -1 });
    res.json({ announcements });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId } = req.params;
    const userId = req.user?.userId;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    const member = await GroupMember.findOne({ groupId: announcement.groupId, userId, status: 'active' });
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete announcements' });
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
