// src/schemas/client.schema.js
import { z } from 'zod'

// Helpers RUT
const cleanRut = (rut) => String(rut).trim().replace(/\./g, '').toUpperCase()
const computeDV = (numStr) => {
  let sum = 0; let mul = 2
  for (let i = numStr.length - 1; i >= 0; i--) {
    sum += parseInt(numStr[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const mod = 11 - (sum % 11)
  return mod === 11 ? '0' : mod === 10 ? 'K' : String(mod)
}

export const rutWithDV = z.string()
  .trim()
  .transform(cleanRut)
  .refine(v => /^\d{7,8}-?[0-9K]$/.test(v), {
    message: 'RUT inválido. Formato: 12345678-9 o 12345678K'
  })
  .transform(v => v.replace(/^(\d{7,8})-?([0-9K])$/, '$1-$2')) // a NNNNNNNN-DV
  .refine(v => {
    const [num, dv] = v.split('-')
    return computeDV(num) === dv
  }, { message: 'RUT inválido (DV no coincide)' })

export const rutParamSchema = z.object({
  rut: rutWithDV
})

// Helpers email/phone
const emailTransform = z.string()
  .trim()
  .min(3)
  .max(100)
  .email('Email inválido')
  .transform(s => s.toLowerCase())

/**
 * Normaliza teléfonos de Chile a +569XXXXXXXX
 * Acepta: "+56 9 1234 5678", "56912345678", "9XXXXXXXX", "09XXXXXXXX", con o sin separadores
 */
const phoneTransform = z.string()
  .trim()
  .min(9, 'Número de teléfono inválido')
  .max(20, 'Número de teléfono inválido')
  .transform((s) => {
    const digits = s.replace(/[^\d]/g, '')
    // 9 + 8 dígitos -> +56 + 9 + 8 dígitos
    if (digits.length === 9 && digits.startsWith('9')) return `+56${digits}`
    // 09 + 8 dígitos -> +569 + 8 dígitos
    if (digits.length === 10 && digits.startsWith('09')) return `+569${digits.slice(1)}`
    // 56 9 + 8 dígitos -> +569 + 8 dígitos
    if (digits.length === 11 && digits.startsWith('569')) return `+${digits}`
    // Si vino ya con +569XXXXXXXX lo dejamos (pasó por .trim)
    if (/^\+569\d{8}$/.test(s)) return s
    return s // dejamos que la refine final valide
  })
  .refine(v => /^\+569\d{8}$/.test(v), { message: 'Número de teléfono inválido' })

export const createClientSchema = z.object({
  rut: rutWithDV,
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(255),
  phone: phoneTransform,
  email: emailTransform,
  avatar: z.string().url().max(255).optional()
})

export const updateClientSchema = z.object({
  rut: rutWithDV.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  address: z.string().trim().min(1).max(255).optional(),
  phone: phoneTransform.optional(),
  email: emailTransform.optional(),
  avatar: z.string().url().max(255).optional()
})
