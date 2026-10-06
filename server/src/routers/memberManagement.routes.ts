import { Router } from 'express';
import { authenticateToken } from '../libs/middleware/auth.middleware';
import { createBulkImportJob, getBulkImportJob, getBulkImportJobs } from '../controllers/bulkImport.controller';
import { createInvitations, getInvitations, acceptInvitation, cancelInvitation } from '../controllers/invitation.controller';

const router = Router();

router.use(authenticateToken);

// Bulk import routes
router.post('/bulk-import', createBulkImportJob);
router.get('/bulk-import/:jobId', getBulkImportJob);
router.get('/bulk-import/association/:associationId', getBulkImportJobs);

// Invitation routes
router.post('/invitations', createInvitations);
router.get('/invitations/:associationId', getInvitations);
router.post('/invitations/accept', acceptInvitation);
router.delete('/invitations/:invitationId', cancelInvitation);

export default router;
