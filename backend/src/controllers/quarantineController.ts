import { Request, Response, NextFunction } from 'express';
import { getQuarantineRecords, resolveQuarantineRecord } from '../services/quarantineService';

export const listQuarantine = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extrae la página y límite de la URL 
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await getQuarantineRecords(page, limit);

        res.status(200).json({
            status: 'success',
            data: result.data,
            meta: result.meta
        });
    } catch (error) {
        next(error); // Manejador de errores global
    }
};

export const resolveRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const correctedData = req.body;


        if (!id || typeof id !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'El ID proporcionado no es válido o está ausente.'
            });
        }

        const newProduct = await resolveQuarantineRecord(id, correctedData);

        res.status(200).json({
            status: 'success',
            message: 'Registro corregido con éxito',
            data: newProduct
        });
    } catch (error: any) {
        // Si es un error de Zod (nuestra validación), devolvemos un 400 Bad Request
        if (error.message.includes('inválidos')) {
            res.status(400).json({ status: 'error', message: error.message });
        } else {
            next(error);
        }
    }
};