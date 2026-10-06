import { Request, Response } from 'express';
import Event from '../models/event.models';
import Group from '../models/group.models';
import GroupMember from '../models/groupMember.models';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { title, description, location, startDate, endDate } = req.body;
    const userId = req.user?.userId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = await GroupMember.findOne({ groupId, userId, status: 'active' });
    if (!member) return res.status(403).json({ message: 'Not a group member' });

    const event = await Event.create({
      groupId,
      communityId: group.communityId,
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: userId,
      responses: []
    });

    const populated = await Event.findById(event._id).populate('createdBy', 'name avatar');
    res.status(201).json({ event: populated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupEvents = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const events = await Event.find({ groupId })
      .populate('createdBy', 'name avatar')
      .populate('responses.userId', 'name avatar')
      .sort({ startDate: 1 });
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const respondToEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const member = await GroupMember.findOne({ groupId: event.groupId, userId, status: 'active' });
    if (!member) return res.status(403).json({ message: 'Not a group member' });

    event.responses = event.responses.filter(r => r.userId.toString() !== userId);
    event.responses.push({ userId: userId as any, status, respondedAt: new Date() });

    await event.save();
    const updated = await Event.findById(eventId)
      .populate('createdBy', 'name avatar')
      .populate('responses.userId', 'name avatar');
    res.json({ event: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.userId;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const member = await GroupMember.findOne({ groupId: event.groupId, userId, status: 'active' });
    if (!member || (member.role !== 'admin' && event.createdBy.toString() !== userId)) {
      return res.status(403).json({ message: 'Only event creator or admin can delete event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
