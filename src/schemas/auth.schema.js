import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(3),
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().url().optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})
