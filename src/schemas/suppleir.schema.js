import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('invalid URL').optional(),
  rut: z
    .string()
    .regex(/^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/, 'Invalid RUT format')
    .min(1, 'RUT is required'),
  paymentTerms: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  notes: z.string().optional()
})

export const updateSupplierSchema = supplierSchema.partial()
