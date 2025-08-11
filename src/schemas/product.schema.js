import { z } from 'zod'

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const productSchema = z.object({
  name: z.string().min(1, { message: 'The name is required.' }).max(100, { message: 'Name too long' }),
  description: z.string().max(500, { message: 'Description too long' }).optional(),
  price: z.preprocess(
    val => Number(val),
    z.number({ invalid_type_error: 'Price must be a number' }).min(0, { message: 'The price cannot be negative.' })
  ),
  stock: z.preprocess(
    val => Number(val),
    z.number({ invalid_type_error: 'Stock must be a number' })
      .int({ message: 'Stock must be an integer' })
      .min(0, { message: 'Stock cannot be negative.' })
  ),
  category: z.string().min(1, { message: 'Category is required.' }),
  supplier: z.string()
    .min(1, { message: 'Supplier is required.' })
    .regex(objectIdRegex, { message: 'Supplier must be a valid ObjectId' })
})

export const productUpdateSchema = productSchema
  .partial()
  .extend({
    replaceStock: z.boolean().optional()
  })
