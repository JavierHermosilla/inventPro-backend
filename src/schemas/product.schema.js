import { z } from 'zod'

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

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
  categoryId: z.string().regex(uuidRegex, { message: 'Category ID must be a valid UUID' }),
  supplierId: z.string().regex(uuidRegex, { message: 'Supplier ID must be a valid UUID' })
})

export const productUpdateSchema = productSchema.partial().extend({
  replaceStock: z.boolean().optional()
})
