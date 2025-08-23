import { z } from 'zod'

// Función para validar RUT chileno
function validateRUT (rut) {
  const cleanRut = rut.replace(/\./g, '').replace('-', '')
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier
    multiplier = multiplier < 7 ? multiplier + 1 : 2
  }

  const dvCalc = 11 - (sum % 11)
  const dvExpected = dvCalc === 11 ? '0' : dvCalc === 10 ? 'K' : dvCalc.toString()
  return dv === dvExpected
}

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
    .regex(/^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/, { message: 'Invalid RUT format' })
    .refine(validateRUT, { message: 'Invalid RUT' }),
  paymentTerms: optionalString(200),
  categories: z.array(z.string().min(1)).optional().default([]),
  status: optionalStatus,
  notes: optionalString(1000)
})

// Para actualizaciones parciales
export const updateSupplierSchema = supplierSchema.partial()
