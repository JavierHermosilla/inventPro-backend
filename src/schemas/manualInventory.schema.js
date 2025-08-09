import { z } from 'zod'
import mongoose from 'mongoose'

// validar que el ID sea un objeto valido
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId'
  })

// Creacion de ajuste de inventario
export const createManualInventorySchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    type: z.enum(['increase', 'decrease']),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .min(1, { message: 'Quantity must be at least 1' }),
    reason: z
      .string()
      .max(255, { message: 'Reason is too long' })
      .optional()

  })
})

// actualizacion del ajuste, es opcional siguiendo las reglas del negocio
export const updateManualInventorySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  reason: z.string().max(255).optional(),
  type: z.enum(['increase', 'decrease']).optional()
})
