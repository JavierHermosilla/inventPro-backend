import { z } from 'zod'

// Limpia puntos y deja mayúsculas en DV
const cleanRut = (rut) =>
  rut.replace(/\./g, '').toUpperCase()

// Calcula DV con algoritmo en módulo 11
const computeDV = (numStr) => {
  let sum = 0
  let mul = 2
  for (let i = numStr.length - 1; i >= 0; i--) {
    sum += parseInt(numStr[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const mod = 11 - (sum % 11)
  if (mod === 11) return '0'
  if (mod === 10) return 'K'
  return String(mod)
}

const rutWithDV = z.string()
  // 1) Formato general con o sin puntos, con guion obligatorio
  .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk]$/, { message: 'RUT inválido. Formato esperado: 12345678-9' })
  // 2) Normaliza para chequear DV
  .transform((value) => cleanRut(value))
  // 3) Valida DV
  .refine((value) => {
    const [num, dv] = value.split('-')
    if (!num || !dv) return false
    return computeDV(num) === dv
  }, { message: 'RUT inválido (DV no coincide)' })

export const createClientSchema = z.object({
  rut: rutWithDV,
  name: z.string().min(1, { message: 'El nombre es obligatorio' }).max(100, { message: 'El nombre no puede exceder los 100 caracteres' }),
  address: z.string().min(1, { message: 'La dirección es obligatoria' }).max(255, { message: 'La dirección no puede exceder los 255 caracteres' }),
  phone: z.string().regex(/^\+?\d{7,15}$/, { message: 'Número de teléfono inválido' }),
  email: z.string().email({ message: 'Correo electrónico inválido' }).max(100, { message: 'El email no puede exceder los 100 caracteres' }),
  avatar: z.string().url().max(255).optional()
})

export const updateClientSchema = z.object({
  rut: rutWithDV.optional(), // <- si envían rut en update, también valida DV
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?\d{7,15}$/).optional(),
  email: z.string().email().max(100).optional(),
  avatar: z.string().url().max(255).optional()
})
