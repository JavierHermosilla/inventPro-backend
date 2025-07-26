import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'The name is required.'),
  description: z.string().optional(),
  price: z.number().min(0, 'The price cannot be negative.'),
  stock: z.number().int().min(0, 'Stock cannot be negative.'),
  category: z.string().min(1, 'Category is required.')
})
