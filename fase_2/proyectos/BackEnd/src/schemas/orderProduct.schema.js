// src/schemas/orderProduct.schema.js
import { z } from 'zod'

// Crear item
export const createOrderProductSchema = z.object({
  orderId: z.string().uuid({ message: 'El orderId debe ser un UUID válido' }),
  productId: z.string().uuid({ message: 'El productId debe ser un UUID válido' }),
  quantity: z.coerce.number().int().positive({ message: 'La cantidad mínima es 1' })
}).strict()

// Actualizar cantidad (PUT/PATCH)
export const updateOrderProductSchema = z.object({
  quantity: z.coerce.number().int().positive({ message: 'La cantidad mínima es 1' })
}).strict()

// (Opcional; si ya usas validateUUID('id') no lo necesitas)
export const orderProductIdSchema = z.object({
  id: z.string().uuid({ message: 'El id debe ser un UUID válido' })
})
