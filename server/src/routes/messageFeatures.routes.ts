import { Router } from 'express';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import {
    addReaction,
    removeReaction,
    getMessageReactions,
    bookmarkMessage,
    removeBookmark,
    getUserBookmarks,
    markMessageRead,
    getMessageReadReceipts
} from '../controllers/messageFeatures.controller';

const router = Router();

// Reactions
router.post('/messages/:messageId/reactions', authenticateToken, addReaction);
router.delete('/messages/:messageId/reactions', authenticateToken, removeReaction);
router.get('/messages/:messageId/reactions', authenticateToken, getMessageReactions);

// Bookmarks
router.post('/messages/:messageId/bookmark', authenticateToken, bookmarkMessage);
router.delete('/messages/:messageId/bookmark', authenticateToken, removeBookmark);
router.get('/bookmarks', authenticateToken, getUserBookmarks);

// Read receipts
router.post('/messages/:messageId/read', authenticateToken, markMessageRead);
router.get('/messages/:messageId/reads', authenticateToken, getMessageReadReceipts);

export default router;
