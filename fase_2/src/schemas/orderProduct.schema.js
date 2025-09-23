import { z } from 'zod'

// Schema para crear un OrderProduct
export const createOrderProductSchema = z.object({
  orderId: z.string().uuid({ message: 'El orderId debe ser un UUID válido' }),
  productId: z.string().uuid({ message: 'El productId debe ser un UUID válido' }),
  quantity: z.number().int().min(1, { message: 'La cantidad mínima es 1' })
}).strict()

// update es inmutable si se intenta se espera 409
export const updateOrderProductSchema = z.object({}).strict()

// Schema para parámetros (id)
export const orderProductIdSchema = z.object({
  id: z.string().uuid({ message: 'El id debe ser un UUID válido' })
})
