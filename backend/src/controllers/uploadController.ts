import { Request, Response, NextFunction } from 'express';

export const uploadFile = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se envió ningún archivo.' });
      return;
    }

    // Por ahora, solo respondemos que todo salió bien y mostramos los datos del archivo
    res.status(200).json({
      status: 'success',
      message: 'Archivo recibido y guardado temporalmente.',
      data: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    next(error);
  }
};