// src/schemas/supplier.schema.js
import { z } from 'zod'

// Normaliza: quita puntos y deja DV en mayúscula
const normalizeRut = (rut) => String(rut ?? '').toUpperCase().replace(/\./g, '')

// Valida DV (módulo 11) sobre un RUT normalizado con guion
const validateRUT = (rut) => {
  const clean = String(rut ?? '')
  const [body, dvRaw] = clean.split('-')
  if (!body || !dvRaw) return false
  const dv = dvRaw.toUpperCase()

  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const mod = 11 - (sum % 11)
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod)
  return dv === expected
}

// Formato esperado *después* de normalizar: ########-DV (sin puntos)
const isNormalizedRutFormat = (value) => /^(\d{7,8}-[\dK])$/i.test(String(value ?? ''))

// Helpers para strings opcionales que aceptan '' o null y limitan longitud
const optionalString = (maxLength) =>
  z.string()
    .optional()
    .nullable()
    .transform(val => (val === undefined || val === null ? '' : val))
    .refine(val => val.length <= maxLength, { message: `Must be at most ${maxLength} characters` })

const optionalEmail = z.string()
  .optional()
  .transform(val => (val === undefined || val === null ? '' : val))
  .refine(val => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Invalid email' })

const phone = z.string()
  .transform(val => (val === undefined || val === null ? '' : val))
  .refine(val => val === '' || /^\+?\d{7,15}$/.test(val), { message: 'Invalid phone number' })

const optionalURL = z.string()
  .optional()
  .transform(val => (val === undefined || val === null ? '' : val))
  .refine(val => val === '' || /^https?:\/\/.+/.test(val), { message: 'Invalid URL' })

// Para status, permitimos vacío o null y aplicamos default 'active'
const optionalStatus = z.string()
  .optional()
  .transform(val => {
    if (val === undefined || val === null || val === '') return 'active'
    if (['active', 'inactive'].includes(val)) return val
    throw new Error('Invalid status')
  })

export const supplierSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  contactName: optionalString(100),
  email: optionalEmail,
  phone,
  address: optionalString(200),
  website: optionalURL,
  rut: z.string()
    .nonempty({ message: 'RUT is required' })
    .transform(normalizeRut) // 1) normaliza
    .refine(isNormalizedRutFormat, { message: 'Invalid RUT format' }) // 2) formato (sin puntos, con guion)
    .refine(validateRUT, { message: 'Invalid RUT' }), // 3) dígito verificador
  paymentTerms: optionalString(200),
  categories: z.array(z.string().min(1)).optional().default([]),
  status: optionalStatus,
  notes: optionalString(1000)
})

export const updateSupplierSchema = supplierSchema.partial()
