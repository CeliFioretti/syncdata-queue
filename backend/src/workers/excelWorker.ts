import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { processExcelSync } from '../services/excelService';

const redisConnection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null,
});

// Instancia de Worker
export const excelWorker = new Worker('excel-processing', async (job: Job) => {
  const { filePath, jobId } = job.data;

  console.log(`[WORKER] 🚀 Iniciando procesamiento del Job ID: ${jobId}`);

  // TESTING: Se simula que el archivo pesa 500MB y tarda 10 segundos en procesarse
  console.log(`[WORKER] ⏳ Simulando procesamiento pesado de 10 segundos...`);
  await new Promise(resolve => setTimeout(resolve, 10000));

  const result = await processExcelSync(filePath, jobId);

  return result; // Este return le avisa a BullMQ que el trabajo fue exitoso
},
  {
    connection: redisConnection,
    // CAPA DE SEGURIDAD: Control de Concurrencia
    concurrency: 1
  }
);

// Eventos para monitorear qué está haciendo el Worker en la consola
excelWorker.on('completed', (job, returnvalue) => {
  console.log(`[WORKER] ✅ Job ${job.id} completado. Filas insertadas: ${returnvalue.inserted}`);
});

excelWorker.on('failed', (job, err) => {
  console.log(`[WORKER] ❌ Job ${job?.id} falló con error: ${err.message}`);
});