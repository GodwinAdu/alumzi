import express from 'express';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import { requireGroupMembership, requireGroupAdmin, canPostInGroup } from '../middleware/groupAccess';
import {
    getCommunityGroups,
    joinGroup,
    leaveGroup,
    createGroup,
    getGroupMembers,
    getGroupJoinRequests,
    approveJoinRequest,
    rejectJoinRequest
} from '../controllers/group.controller';
import {
    getGroupFinancialSummary,
    getAllGroupsFinancialSummary
} from '../controllers/groupFinancial.controller';
import {
    getGroupSettings,
    updateGroupSettings,
    updateGroupInfo,
    addGroupMembers,
    removeGroupMember,
    promoteToAdmin,
    demoteFromAdmin
} from '../controllers/groupSettings.controller';
import {
    getGroupChat,
    getGroupMessages,
    sendGroupMessage,
    editMessage,
    starMessage,
    unstarMessage,
    getStarredMessages,
    forwardMessage
} from '../controllers/chat.controller';
import { createEvent, getGroupEvents, respondToEvent, deleteEvent } from '../controllers/event.controller';
import { createPoll, getGroupPolls, votePoll, closePoll } from '../controllers/poll.controller';
import { createAnnouncement, getGroupAnnouncements, deleteAnnouncement } from '../controllers/announcement.controller';
import { pinMessage, unpinMessage, getPinnedMessages } from '../controllers/chat.controller';

const router = express.Router();

// Public routes (no group membership required)
router.get('/community/:communityId', authenticateToken, getCommunityGroups);
router.get('/community/:communityId/consolidated-finances', authenticateToken, getAllGroupsFinancialSummary);
router.post('/:groupId/join', authenticateToken, joinGroup);
router.post('/:groupId/leave', authenticateToken, leaveGroup);
router.post('/create', authenticateToken, createGroup);

// Admin-only routes
router.get('/:groupId/join-requests', authenticateToken, requireGroupAdmin, getGroupJoinRequests);
router.post('/join-requests/:requestId/approve', authenticateToken, approveJoinRequest);
router.post('/join-requests/:requestId/reject', authenticateToken, rejectJoinRequest);
router.get('/:groupId/settings', authenticateToken, requireGroupAdmin, getGroupSettings);
router.put('/:groupId/settings', authenticateToken, requireGroupAdmin, updateGroupSettings);
router.put('/:groupId/info', authenticateToken, requireGroupAdmin, updateGroupInfo);
router.post('/:groupId/members', authenticateToken, requireGroupAdmin, addGroupMembers);
router.delete('/:groupId/members/:memberId', authenticateToken, requireGroupAdmin, removeGroupMember);
router.put('/:groupId/members/:memberId/promote', authenticateToken, requireGroupAdmin, promoteToAdmin);
router.put('/:groupId/members/:memberId/demote', authenticateToken, requireGroupAdmin, demoteFromAdmin);

// Member routes (requires group membership)
router.get('/:groupId/members', authenticateToken, requireGroupMembership, getGroupMembers);
router.get('/:groupId/financial-summary', authenticateToken, requireGroupMembership, getGroupFinancialSummary);
router.get('/:groupId/chat', authenticateToken, requireGroupMembership, getGroupChat);
router.get('/:groupId/messages', authenticateToken, requireGroupMembership, getGroupMessages);
router.post('/:groupId/messages', authenticateToken, requireGroupMembership, canPostInGroup, sendGroupMessage);
router.put('/messages/:messageId/edit', authenticateToken, editMessage);
router.put('/messages/:messageId/star', authenticateToken, starMessage);
router.delete('/messages/:messageId/star', authenticateToken, unstarMessage);
router.get('/starred-messages', authenticateToken, getStarredMessages);
router.post('/messages/:messageId/forward', authenticateToken, forwardMessage);
router.post('/:groupId/events', authenticateToken, requireGroupMembership, createEvent);
router.get('/:groupId/events', authenticateToken, requireGroupMembership, getGroupEvents);
router.put('/events/:eventId/respond', authenticateToken, respondToEvent);
router.delete('/events/:eventId', authenticateToken, deleteEvent);
router.post('/:groupId/polls', authenticateToken, requireGroupMembership, createPoll);
router.get('/:groupId/polls', authenticateToken, requireGroupMembership, getGroupPolls);
router.put('/polls/:pollId/vote', authenticateToken, votePoll);
router.put('/polls/:pollId/close', authenticateToken, closePoll);
router.post('/:groupId/announcements', authenticateToken, requireGroupAdmin, createAnnouncement);
router.get('/:groupId/announcements', authenticateToken, requireGroupMembership, getGroupAnnouncements);
router.delete('/announcements/:announcementId', authenticateToken, requireGroupAdmin, deleteAnnouncement);
router.put('/messages/:messageId/pin', authenticateToken, requireGroupAdmin, pinMessage);
router.put('/messages/:messageId/unpin', authenticateToken, requireGroupAdmin, unpinMessage);
router.get('/:groupId/pinned-messages', authenticateToken, requireGroupMembership, getPinnedMessages);

export default router;
