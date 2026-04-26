import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { addUploadJob } from '../services/queueService';

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se envió ningún archivo.' });
      return;
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Genera al ticket para el usuario
    const jobId = randomUUID();

    // Toma ese archivo y agregalo a la cola
    await addUploadJob({
      jobId,
      filePath,
      originalName
    });

    // Responde 200 con el ticket
    res.status(200).json({
      status: 'success',
      message: 'Archivo recibido correctamente. El procesamiento en segundo plano ha comenzado.',
      data: {
        jobId,
        fileName: originalName,
        status: 'PENDING'
      }
    });
  } catch (error) {
    next(error);
  }
};