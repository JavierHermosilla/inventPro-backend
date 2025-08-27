import { z } from 'zod'

// Schema para crear un OrderProduct
export const createOrderProductSchema = z.object({
  orderId: z.string().uuid({ message: 'El orderId debe ser un UUID válido' }),
  productId: z.string().uuid({ message: 'El productId debe ser un UUID válido' }),
  quantity: z.number().int().min(1, { message: 'La cantidad mínima es 1' }),
  price: z.number().nonnegative({ message: 'El precio debe ser >= 0' })
})

// Schema para actualizar un OrderProduct (opcional permitir cambios parciales)
export const updateOrderProductSchema = z.object({
  quantity: z.number().int().min(1, { message: 'La cantidad mínima es 1' }).optional(),
  price: z.number().nonnegative({ message: 'El precio debe ser >= 0' }).optional()
})

// Schema para parámetros (id)
export const orderProductIdSchema = z.object({
  id: z.string().uuid({ message: 'El id debe ser un UUID válido' })
})
