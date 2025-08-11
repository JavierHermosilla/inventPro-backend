import { z } from 'zod'

const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/

export const supplierSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  contactName: z.string().max(100).optional(),
  email: z.string().email({ message: 'Invalid email' }).optional(),
  phone: z.string().regex(/^\+?\d{7,15}$/, { message: 'Invalid phone number' }).optional(),
  address: z.string().max(200).optional(),
  website: z.string().url({ message: 'Invalid URL' }).optional(),
  rut: z
    .string()
    .nonempty({ message: 'RUT id required' })
    .regex(rutRegex, { message: 'Invalid RUT format' }),
  paymentTerms: z.string().max(200).optional(),
  categories: z.array(z.string().min(1)).optional(),
  status: z.enum(['active', 'inactive']).optional().default('active'),
  notes: z.string().max(1000).optional()
})

export const updateSupplierSchema = supplierSchema.partial()
