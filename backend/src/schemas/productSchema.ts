import { z } from 'zod';

// Función de mitigación para CSV/Formula Injection
const sanitizeCsvInjection = (value: string) => {
  // Verificamos si el string empieza con =, +, - o @
  if (/^[=+\-@]/.test(value)) {
    // Le agregamos una comilla simple al principio para neutralizar la ejecución
    return `'${value}`;
  }
  return value;
};

// Este esquema define cómo DEBE venir cada fila del Excel.
export const productExcelSchema = z.object({

  sku: z.string({ message: "El SKU es obligatorio y debe ser texto" })
        .min(4, "El SKU debe tener al menos 4 caracteres")
        .trim()
        .transform(sanitizeCsvInjection),

  name: z.string({ message: "El nombre es obligatorio" })
         .min(2, "El nombre es muy corto")
         .transform(sanitizeCsvInjection),

  price: z.coerce.number({ message: "El precio debe ser un número válido" })
          .positive("El precio no puede ser negativo ni cero"),

  stock: z.coerce.number({ message: "El stock debe ser un número" })
          .int("El stock debe ser un número entero")
          .nonnegative("El stock no puede ser negativo"), // Permite 0

  category: z.string({ message: "La categoría es obligatoria" })
             .min(1, "La categoría no puede estar vacía")
             .transform(sanitizeCsvInjection),

  // Transformación avanzada de booleanos
  isActive: z.union([z.string(), z.boolean()]).optional().transform((val) => {
      if (val === undefined) return true; // Por defecto es true
      if (typeof val === 'boolean') return val;
      const cleanStr = val.toLowerCase().trim();
      return cleanStr === 'si' || cleanStr === 'sí' || cleanStr === 'true' || cleanStr === '1';
  }),

  supplierEmail: z.string().email("Formato de email inválido").optional().or(z.literal(''))
});

// Extraemos el tipo de TypeScript directamente de Zod para usarlo luego
export type ProductExcelRow = z.infer<typeof productExcelSchema>;