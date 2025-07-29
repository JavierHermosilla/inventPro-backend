import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'The name is required.'),
  description: z.string().optional(),
  price: z.preprocess(val => Number(val), z.number().min(0, 'The price cannot be negative.')),
  stock: z.preprocess(val => Number(val), z.number().int().min(0, 'Stock cannot be negative.')),
  category: z.string().min(1, 'Category is required.')
})

export const productUpdateSchema = productSchema.partial()
