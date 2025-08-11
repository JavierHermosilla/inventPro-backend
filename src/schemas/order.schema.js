import { z } from 'zod'

export const orderSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID is required' }),

  products: z.array(
    z.object({
      productId: z.string().min(1, { message: 'Product ID is required' }),
      quantity: z.number()
        .int({ message: 'Quantity must be an integer' })
        .min(1, { message: 'Quantity must be greater than 0' }),
      price: z.number()
        .nonnegative({ message: 'Price must be non-negative' })
    })
  ).min(1, { message: 'At least one product is required' }),

  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),

  totalAmount: z.number()
    .min(0, { message: 'Total amount must be non-negative' })
    .optional(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

// Para actualización parcial, todos los campos opcionales
export const orderUpdateSchema = orderSchema.partial()
