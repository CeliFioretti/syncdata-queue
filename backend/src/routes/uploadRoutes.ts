import { Router } from 'express';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { uploadFile, getUploadStatus } from '../controllers/uploadController';

const router = Router();

// Endpoint: POST /api/v1/upload
router.post('/upload', uploadMiddleware.single('file'), uploadFile);

// NUEVO Endpoint: GET /api/v1/upload/status/:jobId
router.get('/status/:jobId', getUploadStatus);

export default router;