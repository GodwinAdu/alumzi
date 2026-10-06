import { Request, Response } from 'express';
import Poll from '../models/poll.models';
import Group from '../models/group.models';
import GroupMember from '../models/groupMember.models';

export const createPoll = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { question, options, expiresAt, allowMultiple } = req.body;
    const userId = req.user?.userId;

    if (!options || options.length < 2) {
      return res.status(400).json({ message: 'Poll must have at least 2 options' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = await GroupMember.findOne({ groupId, userId, status: 'active' });
    if (!member) return res.status(403).json({ message: 'Not a group member' });

    const poll = await Poll.create({
      groupId,
      communityId: group.communityId,
      question,
      options: options.map((text: string) => ({ text, votes: [] })),
      createdBy: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      allowMultiple: allowMultiple || false
    });

    const populated = await Poll.findById(poll._id).populate('createdBy', 'name avatar');
    res.status(201).json({ poll: populated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupPolls = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const polls = await Poll.find({ groupId, isActive: true })
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ polls });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const votePoll = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user?.userId;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (!poll.isActive) return res.status(400).json({ message: 'Poll is closed' });
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ message: 'Poll has expired' });
    }

    const member = await GroupMember.findOne({ groupId: poll.groupId, userId, status: 'active' });
    if (!member) return res.status(403).json({ message: 'Not a group member' });

    if (!poll.allowMultiple) {
      poll.options.forEach(opt => {
        opt.votes = opt.votes.filter(v => v.userId.toString() !== userId);
      });
    }

    const hasVoted = poll.options[optionIndex].votes.some(v => v.userId.toString() === userId);
    if (hasVoted) {
      poll.options[optionIndex].votes = poll.options[optionIndex].votes.filter(v => v.userId.toString() !== userId);
    } else {
      poll.options[optionIndex].votes.push({ userId: userId as any, votedAt: new Date() });
    }

    await poll.save();
    const updated = await Poll.findById(pollId).populate('createdBy', 'name avatar');
    res.json({ poll: updated });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const closePoll = async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = req.user?.userId;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: 'Poll not found' });

    const member = await GroupMember.findOne({ groupId: poll.groupId, userId, status: 'active' });
    if (!member || (member.role !== 'admin' && poll.createdBy.toString() !== userId)) {
      return res.status(403).json({ message: 'Only poll creator or admin can close poll' });
    }

    poll.isActive = false;
    await poll.save();
    res.json({ poll });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
