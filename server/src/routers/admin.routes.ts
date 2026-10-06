import { Router } from 'express';
import { getAssociationsForReview, moderateAssociation, getAssociationStats } from '../controllers/admin.controller';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import { requireAdminRole } from '../middleware/adminAuth';

const router = Router();

// Admin association management routes
router.get('/associations', authenticateToken, requireAdminRole, getAssociationsForReview);
router.put('/associations/:associationId/moderate', authenticateToken, requireAdminRole, moderateAssociation);
router.get('/associations/stats', authenticateToken, requireAdminRole, getAssociationStats);

export default router;