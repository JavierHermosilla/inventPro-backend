import { z } from 'zod'
import { ROLES } from '../config/roles.js'

const phoneRegex = /^[0-9+()\-\s]+$/

export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: 'El nombre de usuario es obligatorio' })
      .trim()
      .min(3, 'El nombre de usuario debe tener mínimo 3 caracteres')
      .max(30, 'El nombre de usuario no debe superar los 30 caracteres'),
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener mínimo 2 caracteres')
      .max(50, 'El nombre no debe superar los 50 caracteres'),
    email: z
      .string({ required_error: 'El email es obligatorio' })
      .trim()
      .toLowerCase()
      .email('Formato de email inválido')
      .max(100, 'El email no debe superar los 100 caracteres'),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener mínimo 8 caracteres')
      .max(64, 'La contraseña no debe superar los 64 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
    phone: z
      .string({ required_error: 'El teléfono es obligatorio' })
      .regex(phoneRegex, 'Formato de teléfono inválido'),

    address: z
      .string()
      .trim()
      .max(200, 'La dirección no debe superar los 200 caracteres')
      .optional(),

    avatar: z.string().url('El avatar debe ser una URL válida').optional(),

    role: z
      .enum(Object.values(ROLES), {
        invalid_type_error: `El rol debe ser uno de: ${Object.values(ROLES).join(', ')}`
      })
      .default(ROLES.USER)
  })
})

export const updateUserSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(30).optional(),
    name: z.string().trim().min(2).max(50).optional(),
    email: z.string().trim().toLowerCase().email().max(100).optional(),
    password: z
      .string()
      .min(8)
      .max(64)
      .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
      .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
      .optional(),
    phone: z.string().regex(phoneRegex).optional(),
    address: z.string().trim().max(200).optional(),
    avatar: z.string().url().optional(),
    role: z.enum(Object.values(ROLES)).optional()
  })
})
