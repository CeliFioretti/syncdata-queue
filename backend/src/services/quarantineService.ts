import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { productExcelSchema } from '../schemas/productSchema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const getQuarantineRecords = async (page: number, limit: number) => {
    // Cálculo matemático para la paginación (Offset)
    const skip = (page - 1) * limit;

    // Ambas consultas en paralelo para mayor velocidad
    const [records, totalRecords] = await Promise.all([
        prisma.quarantineRecord.findMany({
            skip: skip,
            take: limit,
            orderBy: { createdAt: 'desc' } 
        }),
        prisma.quarantineRecord.count()
    ]);

    return {
        data: records,
        meta: {
            total: totalRecords,
            page,
            limit,
            totalPages: Math.ceil(totalRecords / limit)
        }
    };
};

export const resolveQuarantineRecord = async (recordId: string , correctedData: any) => {
    // RE-VALIDACIÓN ESTRICTA (Zero Trust)
    const validation = productExcelSchema.safeParse(correctedData);

    if (!validation.success) {
        const errorMessages = validation.error.issues.map(e => e.message).join(' | ');
        throw new Error(`Los datos corregidos aún son inválidos: ${errorMessages}`);
    }

    // TRANSACCIÓN ATÓMICA
    const result = await prisma.$transaction(async (tx) => {
        // Insertamos en la tabla principal casteando al tipo exacto de Prisma
        const newProduct = await tx.product.create({
            data: validation.data as Prisma.ProductCreateInput
        });

        // Lo eliminamos de la cola de mensajes muertos (Cuarentena)
        await tx.quarantineRecord.delete({
            where: { id: recordId }
        });

        return newProduct;
    });

    return result;
};