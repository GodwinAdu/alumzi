import { Router } from 'express';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import { updateProfile, getProfile, updateOnlineStatus, globalSearch, checkRegisteredContacts } from '../controllers/userProfile.controller';

const router = Router();

router.put('/profile', authenticateToken, updateProfile);
router.get('/profile/:userId', authenticateToken, getProfile);
router.put('/status', authenticateToken, updateOnlineStatus);
router.get('/search', authenticateToken, globalSearch);
router.post('/check-registered', authenticateToken, checkRegisteredContacts);

export default router;
