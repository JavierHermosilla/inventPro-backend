import { z } from 'zod'

// Validación para ObjectId válida de MongoDB
const uuidSchema = z.string().uuid({ message: 'Invalid UUID' })

// Schema para crear un ajuste manual de inventario
export const createManualInventorySchema = z.object({
  productId: uuidSchema,
  type: z.enum(['increase', 'decrease']),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
    .int()
    .min(1, { message: 'Quantity must be at least 1' }),
  reason: z.string()
    .max(255, { message: 'Reason is too long' })
    .optional()
    .transform(r => r?.trim())
}).superRefine((data, ctx) => {
  // validacion de decrease
  if (data.type === 'decrease' && (!data.reason || data.reason.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reason is required when type is decrease',
      path: ['reason']
    })
  }
})

// Schema para actualizar ajuste manual (todos opcionales)
export const updateManualInventorySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  reason: z.string().max(255).optional(),
  type: z.enum(['increase', 'decrease']).optional(),
  productId: uuidSchema.optional()
})
