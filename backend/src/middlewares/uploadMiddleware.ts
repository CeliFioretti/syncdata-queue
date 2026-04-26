import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Aislamiento en Disco y Sanitización de Nombres
//--------------------------------------------------------------------------------------
const storage = multer.diskStorage({
  // Evitamos ataques DoS apuntando a directorios no deseados
  destination: (req, res, cb) => {
    cb(null, 'uploads/'); 
  },

  // Evitamos inyección de malware mediante nombres de archivo
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


// Validación Estricta de Tipos (MIME Types)
//--------------------------------------------------------------------------------------
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Lista blanca estricta (Allowlist)
  const allowedMimeTypes = [
    'text/csv', 
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // El archivo es seguro, lo dejamos pasar
  } else {
    // El archivo es rechazado. Esto disparará un error que atraparemos más adelante.
    cb(new Error('FORMATO_INVALIDO: Solo se permiten archivos .csv, .xls y .xlsx')); 
  }
};

// Restricciones Físicas
//--------------------------------------------------------------------------------------
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    // Seguridad: Prevención de ataques DoS. 
    // Cortamos la conexión automáticamente si el archivo supera los 5 MB.
    fileSize: 5 * 1024 * 1024 
  }
});