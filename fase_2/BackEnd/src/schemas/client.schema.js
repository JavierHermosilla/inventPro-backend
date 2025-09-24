// src/schemas/client.schema.js
import { z } from 'zod'

// Helpers
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
  .refine(v => /^\d{7,8}-?[0-9K]$/.test(v), { message: 'RUT inválido. Formato: 12345678-9 o 12345678K' })
  .transform(v => v.replace(/^(\d{7,8})-?([0-9K])$/, '$1-$2')) // normaliza a NNNNNNNN-DV
  .refine(v => {
    const [num, dv] = v.split('-')
    return computeDV(num) === dv
  }, { message: 'RUT inválido (DV no coincide)' })

export const rutParamSchema = z.object({
  rut: rutWithDV
})

export const createClientSchema = z.object({
  rut: rutWithDV,
  name: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(255),
  phone: z.string().trim().regex(/^\+?\d{7,15}$/, { message: 'Número de teléfono inválido' }),
  email: z.string().trim().toLowerCase().email().max(100),
  avatar: z.string().url().max(255).optional()
})

export const updateClientSchema = z.object({
  rut: rutWithDV.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  address: z.string().trim().min(1).max(255).optional(),
  phone: z.string().trim().regex(/^\+?\d{7,15}$/).optional(),
  email: z.string().trim().toLowerCase().email().max(100).optional(),
  avatar: z.string().url().max(255).optional()
})
