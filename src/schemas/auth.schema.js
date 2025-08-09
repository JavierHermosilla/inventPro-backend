import { ROLES } from '../config/roles.js'
import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, 'Username inválido'),
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  email: z.string().email({ message: 'Must be a valid email address.' }),
  password: z.string()
    .min(6, 'Password must be at least 6 characters.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, 'Password must contain both letters and numbers.'),
  phone: z.string().regex(/^\+?\d{8,15}$/, 'The number must have at least 8 digits.').optional(),
  address: z.string().min(5, { message: 'Address must be at least 5 characters long.' }).optional(),
  avatar: z.string().url({ message: 'The avatar must be a valid URL.' }).optional(),
  role: z.enum(Object.values(ROLES)).optional()
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' })
})
