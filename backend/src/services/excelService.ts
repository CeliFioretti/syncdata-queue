import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { productExcelSchema } from '../schemas/productSchema';
import { PrismaPg } from '@prisma/adapter-pg'; 
import { Pool } from 'pg';

// Creamos la conexión nativa con Postgres
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Corta el array gigante en lotes (Batches)
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunked = [];
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size));
  }
  return chunked;
};

export const processExcelSync = async (filePath: string, jobId: string) => {
  try {
    // 1. Leer el archivo físico desde el disco
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; 

    if (!sheetName) {
        throw new Error('FORMATO_INVALIDO: El archivo Excel no contiene ninguna hoja.');
    }

    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
        throw new Error('FORMATO_INVALIDO: No se pudo leer el contenido de la hoja de cálculo.');
    }
    
    // Convertimos la hoja a un array de objetos JSON
    const rawData = xlsx.utils.sheet_to_json(worksheet);

    const BATCH_SIZE = 500; // El tamaño ideal para no saturar a Prisma
    const batches = chunkArray(rawData, BATCH_SIZE);

    // Contadores globales para el reporte final
    let totalInserted = 0;
    let totalQuarantined = 0;
    let processedCount = 0;

    console.log(`[SERVICIO] 📦 Procesando ${rawData.length} filas en ${batches.length} lotes de ${BATCH_SIZE}...`);

    // 2. Iteramos sobre cada Lote (Batch)
    for (const batch of batches) {
      const validRecords: any[] = [];
      const quarantineRecords: any[] = [];

      // 3. Validación Fila por Fila (SOLO de este lote)
      for (const row of batch) {
        const validation = productExcelSchema.safeParse(row);

        if (validation.success) {
          validRecords.push(validation.data);
        } else {
          // Extraemos los mensajes de error de Zod
          const errorMessages = validation.error.issues.map(e => e.message).join(' | ');
          
          quarantineRecords.push({
            jobId,
            originalData: row as any,
            errorMessage: errorMessages,
            status: 'PENDING'
          });
        }
      }

      // 4. Inserción en Base de Datos (Transacción atómica SOLO de este lote)
      // Se usa async (tx) para poder validar si el array tiene datos antes de intentar insertar
      await prisma.$transaction(async (tx) => {
        if (validRecords.length > 0) {
          await tx.product.createMany({ 
            data: validRecords, 
            skipDuplicates: true 
          });
        }
        
        if (quarantineRecords.length > 0) {
          await tx.quarantineRecord.createMany({ 
            data: quarantineRecords 
          });
        }
      });

      // 5. Actualizamos los contadores
      totalInserted += validRecords.length;
      totalQuarantined += quarantineRecords.length;
      processedCount += batch.length;

      // TODO (Paso 4): Acá conectaremos BullMQ para los WebSockets
      // const progress = Math.round((processedCount / rawData.length) * 100);
      // console.log(`[SERVICIO] Progreso Job ${jobId}: ${progress}%`);
    }

    // Retornamos el resumen final
    return {
      jobId,
      totalRows: rawData.length,
      inserted: totalInserted,
      quarantined: totalQuarantined
    };

  } catch (error: any) {
    throw new Error('Error al procesar el archivo Excel: ' + error.message);
  }
};