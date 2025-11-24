import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    .max(50, { message: 'El nombre de la categoría no puede superar los 50 caracteres' })
    .regex(/^[\p{L}\p{N}\s\-]+$/u, {
      message: 'El nombre solo puede contener letras, números, espacios y guiones'
    }),
  description: z
    .string()
    .trim()
    .max(255, { message: 'La descripción no puede superar los 255 caracteres' })
    .optional()
})
