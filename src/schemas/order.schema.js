import mongoose from 'mongoose'
import { z } from 'zod'

// 🔹 Validador para Mongo ObjectId
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format'
})

// Esquema principal para creación de orden
export const orderSchema = z.object({
  customerId: objectIdSchema,
  products: z.array(
    z.object({
      productId: objectIdSchema,
      quantity: z.number()
        .int({ message: 'Quantity must be an integer' })
        .min(1, { message: 'Quantity must be greater than 0' })
    })
  ).min(1, { message: 'At least one product is required' }),
  status: z.enum(
    ['pending', 'processing', 'completed', 'cancelled'])
    .default('pending'),
  totalAmount: z.number()
    .nonnegative()
    .refine(val => Number(val.toFixed(2)) === val, {
      message: 'Total amount must have at most two decimal places'
    }).optional(),
  createdAt: z.preprocess(arg => arg ? new Date(arg) : undefined, z.date().optional()),
  updatedAt: z.preprocess(arg => arg ? new Date(arg) : undefined, z.date().optional())
}).strict()

// Esquema para actualización parcial
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).optional()
})
