import { Request, Response, NextFunction } from 'express';
import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { addUploadJob } from '../services/queueService';
import { uploadQueue } from '../services/queueService';

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

export const getUploadStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    // Type Guard para seguridad
    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'El ID del Job no es válido o está ausente.'
      });
    }

    // Buscamos el Job directamente en la memoria RAM (Redis) a través de BullMQ
    const job = await Job.fromId(uploadQueue, jobId);

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job no encontrado en el sistema.'
      });
    }

    // Extraemos el estado actual y progreso
    const state = await job.getState();
    const progress = job.progress;

    res.status(200).json({
      status: 'success',
      data: {
        jobId,
        state,
        progress: typeof progress === 'number' ? progress : 0
      }
    });

  } catch (error) {
    next(error);
  }
};