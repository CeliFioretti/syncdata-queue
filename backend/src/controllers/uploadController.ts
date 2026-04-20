import { Request, Response, NextFunction } from 'express';
import { processExcelSync } from '../services/excelService';

export const uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No se envió ningún archivo.' });
      return;
    }

    const filePath = req.file.path;

    const result = await processExcelSync(filePath);

    res.status(200).json({
      status: 'success',
      message: 'Archivo procesado e ingresado al sistema.',
      data: result
    });
  } catch (error) {
    next(error);
  }
};