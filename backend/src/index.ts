import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';


// Importar rutas y middlewares
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler } from './middlewares/errorHandler';

import './workers/excelWorker';

//------------------------------------------------------------------------------------------------------


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


app.use('/api/v1', uploadRoutes);



app.use(errorHandler); // Siempre al final de todas las rutas

//------------------------------------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

