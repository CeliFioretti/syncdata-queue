import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { io } from '../index';

// Conexión a Redis local
const redisConnection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null, // Requisito para evitar deadlocks
});

// Instanciamos la Cola (Queue) llamada 'excel-processing'
export const uploadQueue = new Queue('excel-processing', {
  connection: redisConnection,
  
  // 🛡️ REGLAS DE SEGURIDAD Y RENDIMIENTO (TTL)
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600, 
      count: 100, 
    },
    removeOnFail: {
      age: 86400, 
      count: 1000,
    },
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 2000, // Espera 2s, luego 4s, luego 8s...
    }
  }

});

// Monitor de eventos de la cola especifica
const queueEvents = new QueueEvents('excel-processing', {
    connection: redisConnection,
  });

// Escuchar activamente cuando un Job cambie su progreso
queueEvents.on('progress', ({jobId, data}) => {
  const progress = data as number;

  io.to(jobId).emit('progress_update', {
    jobId: jobId,
    progress: progress,
    message: `Procesando... ${progress}%`,
  })
});

// Función exportable para agregar tickets a la cola
export const addUploadJob = async (jobData: { filePath: string; originalName: string; jobId: string }) => {
  await uploadQueue.add('process-excel', jobData, {
    jobId: jobData.jobId,
  });
};