import { Router } from 'express';
import { listQuarantine, resolveRecord } from '../controllers/quarantineController';

const router = Router();

// GET /api/v1/quarantine?page=1&limit=10
router.get('/', listQuarantine);

// POST /api/v1/quarantine/:id/resolve
router.post('/:id/resolve', resolveRecord);

export default router;