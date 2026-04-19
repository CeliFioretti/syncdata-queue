import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[ERROR]: ${err.message}`);

  // Errores específicos de Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
       res.status(413).json({ status: 'error', message: 'El archivo supera el límite de 5MB.' });
       return;
    }
  }

  // Errores de nuestro FileFilter 
  if (err.message.includes('FORMATO_INVALIDO')) {
     res.status(415).json({ status: 'error', message: err.message });
     return;
  }

  // Error genérico por defecto 
  res.status(500).json({ 
    status: 'error', 
    message: 'Error interno del servidor.' 
  });
};