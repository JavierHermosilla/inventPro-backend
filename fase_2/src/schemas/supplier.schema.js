import { z } from 'zod'
import { isValidRut } from '../utils/rut.js'

// ——— Helpers ———
const trimOrEmpty = (v) => (v ?? '').toString().trim()

// Acepta con/sin guion y sin puntos; inserta guion si falta (último char es DV)
const normalizeRutFlexible = (rut) => {
  const raw = trimOrEmpty(rut).toUpperCase().replace(/\./g, '').replace(/\s+/g, '')
  if (!raw) return ''
  if (raw.includes('-')) return raw
  if (/^\d{7,8}[\dK]$/.test(raw)) {
    const body = raw.slice(0, -1)
    const dv = raw.slice(-1)
    return `${body}-${dv}`
  }
  return raw
}

const isNormalizedRutFormat = (value) =>
  /^(\d{7,8}-[\dK])$/i.test(String(value ?? ''))

const optionalString = (max) =>
  z.preprocess((v) => trimOrEmpty(v), z.string().max(max))

const optionalEmail = z.preprocess(
  (v) => trimOrEmpty(v),
  z.string().email().or(z.literal(''))
)

const optionalPhone = z.preprocess(
  (v) => trimOrEmpty(v),
  // Permite +, espacios, guiones y paréntesis, 7–20 caracteres
  z.string().refine(
    (s) => s === '' || /^\+?[0-9()\-\s]{7,20}$/.test(s),
    { message: 'Invalid phone number' }
  )
)

const optionalURL = z.preprocess(
  (v) => trimOrEmpty(v),
  z.string().url().or(z.literal(''))
)

// Status: en create default 'active'
const statusEnum = z.enum(['active', 'inactive'])
const statusForCreate = z.preprocess(
  (v) => (v == null || v === '' ? 'active' : v),
  statusEnum
)
// update validar si viene
const statusForUpdate = z.preprocess(
  (v) => (v === undefined ? undefined : v),
  statusEnum
).optional()

// ——— Schemas ———
export const supplierSchema = z
  .object({
    name: z.preprocess(
      (v) => trimOrEmpty(v),
      z.string().min(1, { message: 'Name is required' }).max(120)
    ),
    contactName: optionalString(100),
    email: optionalEmail,
    phone: optionalPhone,
    address: optionalString(200),
    website: optionalURL,
    rut: z
      .string()
      .transform(normalizeRutFlexible)
      .refine(isNormalizedRutFormat, { message: 'Invalid RUT format' })
      .refine(isValidRut, { message: 'Invalid RUT' }),
    paymentTerms: optionalString(200),
    categories: z.array(z.string().min(1)).optional().default([]),
    status: statusForCreate,
    notes: optionalString(1000)
  })
  .strict()

export const updateSupplierSchema = z
  .object({
    name: z
      .preprocess(
        (v) => (v === undefined ? undefined : trimOrEmpty(v)),
        z.string().min(1).max(120)
      )
      .optional(),
    contactName: optionalString(100).optional(),
    email: optionalEmail.optional(),
    phone: optionalPhone.optional(),
    address: optionalString(200).optional(),
    website: optionalURL.optional(),
    rut: z
      .string()
      .transform((v) => (v === undefined ? undefined : normalizeRutFlexible(v)))
      .refine(
        (v) => v === undefined || isNormalizedRutFormat(v),
        { message: 'Invalid RUT format' }
      )
      .refine(
        (v) => v === undefined || isValidRut(v),
        { message: 'Invalid RUT' }
      )
      .optional(),
    paymentTerms: optionalString(200).optional(),
    categories: z.array(z.string().min(1)).optional(),
    status: statusForUpdate,
    notes: optionalString(1000).optional()
  })
  .strict()
