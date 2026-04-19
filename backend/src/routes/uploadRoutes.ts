import { Router } from 'express';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

// Endpoint: POST /api/v1/upload
router.post('/upload', uploadMiddleware.single('file'), uploadFile);

export default router;