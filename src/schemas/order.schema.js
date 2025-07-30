import { z } from 'zod'

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  products: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      price: z.number().min(0, 'Price must be non-negative')
    })
  ).min(1, 'At least one product is required'),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative').optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
})

export const orderUpdateSchema = orderSchema.partial()
