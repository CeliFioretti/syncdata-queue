import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se envió ningún archivo.' });
      return;
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // 1. Generamos el "Ticket" para el usuario
    const jobId = randomUUID();

    // TODO (Paso 3): Aquí le diremos a BullMQ "Tomá este filePath y agregalo a la cola"
    // await queueService.addJob({ filePath, originalName, jobId });

    // 2. Respondemos HTTP 202 (Accepted) inmediatamente
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