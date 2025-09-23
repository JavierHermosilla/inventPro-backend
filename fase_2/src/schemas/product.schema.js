import { z } from 'zod'
import { rutWithDV } from './client.schema.js'

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export const productSchema = z.object({
  name: z.string().min(1, { message: 'The name is required.' }).max(100, { message: 'Name too long' }),
  description: z.string().max(500, { message: 'Description too long' }).optional(),

  // Acepta "19990" (string) o 19990 (number)
  price: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'Price must be a number' }).min(0, { message: 'The price cannot be negative.' })
  ),

  // Acepta "50" o 50
  stock: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'Stock must be a number' }).int({ message: 'Stock must be an integer' })
  ),

  categoryId: z.string().regex(uuidRegex, { message: 'Category ID must be a valid UUID' }),

  // 👇 ahora puedes mandar UNO de los dos
  supplierId: z.string().regex(uuidRegex, { message: 'Supplier ID must be a valid UUID' }).optional(),
  supplierRut: rutWithDV.optional()
})
  .superRefine((data, ctx) => {
  // Debe venir supplierId o supplierRut
    if (!data.supplierId && !data.supplierRut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplier'],
        message: 'Provide supplierId or supplierRut'
      })
    }
  })
  .strict()

export const productUpdateSchema = productSchema
  .partial()
  .extend({
    replaceStock: z.boolean().optional()
  })
  .strict()
