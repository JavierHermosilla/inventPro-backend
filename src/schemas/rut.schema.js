import { z } from 'zod'
import { normalizeRut, isValidRut } from '../utils/rut.js'

export const rutSchema = z.string()
  .nonempty({ message: 'RUT is required' })
  .transform((val) => normalizeRut(val))
  .refine((val) => isValidRut(val), { message: 'Invalid RUT' })
