import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// Inicializar Express
const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite a Express entender JSON en el body

// Ruta de prueba (Healthcheck)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'SyncData Queue API corriendo correctamente',
    environment: process.env.NODE_ENV 
  });
});


app.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

