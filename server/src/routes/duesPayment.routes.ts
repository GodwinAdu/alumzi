import { Router } from 'express';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import { requireGroupAdmin } from '../middleware/groupAccess';
import {
    getMemberDuesStatus,
    getGroupDuesStatus,
    getMemberDuesForAdmin,
    initializePayment,
    verifyPayment,
    markPaymentPaid,
    generateDues
} from '../controllers/duesPayment.controller';

const router = Router();

// Member routes - self-service
router.get('/member/:groupId', authenticateToken, getMemberDuesStatus);
router.post('/initialize', authenticateToken, initializePayment);

// Admin routes
router.get('/group/:groupId', authenticateToken, requireGroupAdmin, getGroupDuesStatus);
router.get('/admin/:groupId/:memberId', authenticateToken, requireGroupAdmin, getMemberDuesForAdmin);
router.post('/generate/:groupId', authenticateToken, requireGroupAdmin, generateDues);
router.patch('/mark-paid/:paymentId', authenticateToken, requireGroupAdmin, markPaymentPaid);

// Webhook route (no auth needed)
router.post('/verify', verifyPayment);

export default router;