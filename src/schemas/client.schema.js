import { z } from 'zod'
export const createClientSchema = z.object({
  rut: z.string()
    .regex(/^\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk]$/, { message: 'RUT inválido. Formato esperado: 12345678-9' }),
  name: z.string()
    .min(1, { message: 'El nombre es obligatorio' })
    .max(100, { message: 'El nombre no puede exceder los 100 caracteres' }),
  address: z.string()
    .min(1, { message: 'La dirección es obligatoria' })
    .max(255, { message: 'La dirección no puede exceder los 255 caracteres' }),
  phone: z.string()
    .regex(/^\+?\d{7,15}$/, { message: 'Número de teléfono inválido' }),
  email: z.string()
    .email({ message: 'Correo electrónico inválido' })
    .max(100, { message: 'El email no puede exceder los 100 caracteres' }),
  avatar: z.string().url().max(255).optional()

})

export const updateClientSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?\d{7,15}$/).optional(),
  email: z.string().email().max(100).optional(),
  avatar: z.string().url().max(255).optional()
})
