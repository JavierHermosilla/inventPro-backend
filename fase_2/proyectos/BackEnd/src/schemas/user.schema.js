import { z } from 'zod'
import { ROLES } from '../config/roles.js'

const phoneRegex = /^[0-9+()\-\s]+$/

// Schema para crear usuario
export const createUserSchema = z.object({
  username: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .trim()
    .min(3, { message: 'El nombre de usuario debe tener mínimo 3 caracteres' })
    .max(50, { message: 'El nombre de usuario no debe superar los 50 caracteres' }),

  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, { message: 'El nombre debe tener mínimo 2 caracteres' })
    .max(255, { message: 'El nombre no debe superar los 255 caracteres' }),

  email: z
    .string({ required_error: 'El email es obligatorio' })
    .trim()
    .toLowerCase()
    .email({ message: 'Formato de email inválido' })
    .max(100, { message: 'El email no debe superar los 100 caracteres' }),

  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
    .max(100, { message: 'La contraseña no debe superar los 100 caracteres' })
    .regex(/[A-Z]/, { message: 'Debe contener al menos una letra mayúscula' })
    .regex(/[a-z]/, { message: 'Debe contener al menos una letra minúscula' })
    .regex(/[0-9]/, { message: 'Debe contener al menos un número' })
    .regex(/[^A-Za-z0-9]/, { message: 'Debe contener al menos un carácter especial' }),

  phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: 'Formato de teléfono inválido' })
    .max(20, { message: 'El teléfono no debe superar los 20 caracteres' })
    .optional(),

  address: z
    .string()
    .trim()
    .max(255, { message: 'La dirección no debe superar los 255 caracteres' })
    .optional(),

  avatar: z
    .string()
    .url({ message: 'El avatar debe ser una URL válida' })
    .optional(),

  role: z
    .enum(Object.values(ROLES), {
      invalid_type_error: `El rol debe ser uno de: ${Object.values(ROLES).join(', ')}`
    })
    .default(ROLES.USER)
})

// Schema para actualizar usuario
export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(50).optional(),
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().toLowerCase().email().max(100).optional(),
  password: z.string()
    .min(8)
    .max(100)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/)
    .optional(),
  phone: z.string().trim().regex(phoneRegex).max(20).optional(),
  address: z.string().trim().max(255).optional(),
  avatar: z.string().url().optional(),
  role: z.enum(Object.values(ROLES)).optional()
})
