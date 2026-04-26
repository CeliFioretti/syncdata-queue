import * as xlsx from 'xlsx';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { productExcelSchema } from '../schemas/productSchema';
import { PrismaPg } from '@prisma/adapter-pg'; 
import { Pool } from 'pg';

// Creamos la conexión nativa con Postgres
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Inicializamos el Cliente pasándole el adaptador
const prisma = new PrismaClient({ adapter });

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

    // Arrays temporales para separar los destinos
    const validRecords: any[] = [];
    const quarantineRecords: any[] = [];

    // 2. Validación Fila por Fila
    for (const row of rawData) {
      const validation = productExcelSchema.safeParse(row);

      if (validation.success) {
        validRecords.push(validation.data);
      } else {
        // Extraemos los mensajes de error de Zod y los unimos en un string
        const errorMessages = validation.error.issues.map(e => e.message).join(' | ');
        
        quarantineRecords.push({
          jobId,
          originalData: row as any, // Guardamos la fila basura tal cual vino
          errorMessage: errorMessages,
          status: 'PENDING'
        });
      }
    }

    // 3. Inserción en Base de Datos (Transacción)
    await prisma.$transaction([
      prisma.product.createMany({ 
        data: validRecords, 
        skipDuplicates: true // Prisma ignorará los SKUs que ya existan
      }),
      prisma.quarantineRecord.createMany({ 
        data: quarantineRecords 
      })
    ]);

    // Retornamos un resumen para el cliente
    return {
      jobId,
      totalRows: rawData.length,
      inserted: validRecords.length,
      quarantined: quarantineRecords.length
    };

  } catch (error: any) {
    throw new Error('Error al procesar el archivo Excel: ' + error.message);
  }
};