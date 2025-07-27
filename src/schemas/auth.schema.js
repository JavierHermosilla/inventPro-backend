import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long.' }),
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  email: z.string().email({ message: 'Must be a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  role: z.enum(['admin', 'user']).optional(),
  phone: z.string().min(8, { message: 'The number must have at least 8 digits.' }).optional(),
  address: z.string().min(5, { message: 'Address must be at least 5 characters long.' }).optional(),
  avatar: z.string().url({ message: 'The avatar must be a valid URL.' }).optional()
})

export const loginSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' })
})
