import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';


// Importar rutas y middlewares
import uploadRoutes from './routes/uploadRoutes';
import quarantineRoutes from './routes/quarantineRoutes'; 
import { errorHandler } from './middlewares/errorHandler';

import './workers/excelWorker';

//------------------------------------------------------------------------------------------------------


// Inicializar Express
const app: Application = express();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Ruta de prueba (Healthcheck)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'SyncData Queue API corriendo correctamente',
    environment: process.env.NODE_ENV 
  });
});

// Middlewares globales
app.use(cors());

app.use(express.json()); // Permite a Express entender JSON en el body

app.use('/api/v1', uploadRoutes);
app.use('/api/v1/quarantine', quarantineRoutes);

app.use(errorHandler); // Siempre al final de todas las rutas

//------------------------------------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[WEBSOCKET] 🟢 Nuevo cliente conectado: ${socket.id}`);

  socket.on('suscribeToJob', (jobId: string) => {
    console.log(`[WEBSOCKET] 🟡 Cliente ${socket.id} se suscribió al job ${jobId}`);
    socket.join(jobId);
  });

  socket.on('disconnect', () => {
    console.log(`[WEBSOCKET] 🔴 Cliente desconectado: ${socket.id}`);
  });
});


server.listen(PORT, () => {
  console.log(`[SERVER] 🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

