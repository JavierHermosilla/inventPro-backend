import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'The name is required.').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  price: z.preprocess(
    val => Number(val),
    z.number({ invalid_type_error: 'Price must be a number' }).min(0, 'The price cannot be negative.')),
  stock: z.preprocess(
    val => Number(val),
    z.number({
      invalid_type_error: 'Stock must be a number'
    }).int('Stock must be an integer').min(0, 'Stock cannot be negative.')),
  category: z.string().min(1, 'Category is required.'),
  supplier: z.string().min(1, 'Supplier is required.')
})

export const productUpdateSchema = productSchema
  .partial()
  .extend({
    replaceStock: z.boolean().optional()
  })
