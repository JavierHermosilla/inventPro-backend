import { z } from 'zod'

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),

  products: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number()
        .int({ message: 'quantity must be an integer' })
        .min(1, 'Quantity must be greater than 0'),
      price: z.number()
        .nonnegative('Price must be non-negative')
    })
  ).min(1, 'At least one product is required'),

  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),

  totalAmount: z.number().min(0, 'Total amount must be non-negative').optional(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

export const orderUpdateSchema = orderSchema.partial()
