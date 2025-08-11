import { z } from 'zod'
import mongoose from 'mongoose'

// Validación para ObjectId válida de MongoDB
const objectIdSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId'
})

// Schema para crear un ajuste manual de inventario
export const createManualInventorySchema = z.object({
  body: z.object({
    productId: objectIdSchema,
    type: z.enum(['increase', 'decrease']),
    quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .min(1, { message: 'Quantity must be at least 1' }),
    reason: z.string()
      .max(255, { message: 'Reason is too long' })
      .optional()
  })
})

// Schema para actualizar ajuste manual (todos opcionales)
export const updateManualInventorySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  reason: z.string().max(255).optional(),
  type: z.enum(['increase', 'decrease']).optional()
})
