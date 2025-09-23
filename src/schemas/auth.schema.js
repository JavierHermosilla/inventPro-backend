import { ROLES } from '../config/roles.js'
import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres.' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Nombre de usuario inválido. Solo letras, números y guion bajo.' }),
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, { message: 'La contraseña debe contener letras y números.' }),
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, { message: 'El teléfono debe tener entre 8 y 15 dígitos, puede comenzar con +.' })
    .optional(),
  address: z.string().min(5, { message: 'La dirección debe tener al menos 5 caracteres.' }).optional(),
  avatar: z.string().url({ message: 'El avatar debe ser una URL válida.' }).optional(),
  role: z.enum(Object.values(ROLES)).optional()
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
})

export const userIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Formato de ID de usuario inválido' })
})
