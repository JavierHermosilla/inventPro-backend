//auth.schema.js
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
// category.schema.js
import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    .max(50, { message: 'El nombre de la categoría no puede superar los 50 caracteres' })
    .regex(/^[\p{L}\p{N}\s\-]+$/u, {
      message: 'El nombre solo puede contener letras, números, espacios y guiones'
    }),
  description: z
    .string()
    .trim()
    .max(255, { message: 'La descripción no puede superar los 255 caracteres' })
    .optional()
})
// client.schema.js
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
// manualInventory.schema.js
import { z } from 'zod'

// Validación para UUID v4 válida de MongoDB
const uuidSchema = z.string().uuid({ message: 'Invalid UUID' })

// Schema para crear un ajuste manual de inventario
export const createManualInventorySchema = z.object({
  productId: uuidSchema,
  type: z.enum(['increase', 'decrease']),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
    .int()
    .min(1, { message: 'Quantity must be at least 1' }),
  reason: z.string()
    .max(255, { message: 'Reason is too long' })
    .optional()
    .transform(r => r?.trim())
}).superRefine((data, ctx) => {
  // validacion de decrease
  if (data.type === 'decrease' && (!data.reason || data.reason.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reason is required when type is decrease',
      path: ['reason']
    })
  }
})

// Schema para actualizar ajuste manual (todos opcionales)
export const updateManualInventorySchema = z.object({
  quantity: z.number().int().min(1).optional(),
  reason: z.string().max(255).optional(),
  type: z.enum(['increase', 'decrease']).optional(),
  productId: uuidSchema.optional()
})
// order.schema.js:
// src/schemas/order.schema.js
import { z } from 'zod'
import { rutWithDV } from './client.schema.js'

// ---------- helpers ----------
const uuid = z.string().uuid({ message: 'Invalid UUID format' })

// coerción robusta para quantity (acepta "2", 2, "2.0")
const quantitySchema = z.preprocess(
  (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : v
  },
  z.number().int({ message: 'Quantity must be an integer' }).min(1, { message: 'Quantity must be greater than 0' })
)

// Un item válido: SOLO productId + quantity
const lineItemSchema = z.object({
  productId: uuid,
  quantity: quantitySchema
}).strict() // => no permite price ni otras llaves

// ---------- CREATE: variantes soportadas ----------
/**
 * Acepta UNO de:
 *  1) { clientId, products: [...] }          ← Recomendado (DB exige client_id)
 *  2) { rut, products: [...] }               ← Para crear por RUT del cliente
 *  3) { customerId, products: [...] }        ← Compatibilidad hacia atrás; lo normalizamos a clientId
 */
const createBase = z.object({
  products: z.array(lineItemSchema).min(1, { message: 'At least one product is required' })
}).strict()

const byClientId = createBase.extend({
  clientId: uuid
}).strict()

const byRut = createBase.extend({
  rut: rutWithDV
}).strict()

const byCustomerIdCompat = createBase.extend({
  customerId: uuid
}).strict()

export const orderCreateSchema = z.union([byClientId, byRut, byCustomerIdCompat])

/**
 * Normaliza el payload de creación:
 * - Si viene customerId, lo mapea a clientId (compat)
 * - Convierte quantity a int seguro
 * - Devuelve SOLO { clientId?, rut?, products }
 */
export function normalizeOrderCreate (input) {
  const parsed = orderCreateSchema.parse(input)

  // Normalizar quantities (ya vienen int por el schema, pero nos aseguramos)
  const products = parsed.products.map(p => ({
    productId: p.productId,
    quantity: Math.trunc(Number(p.quantity))
  }))

  // Compat: customerId -> clientId
  const clientId = parsed.clientId ?? parsed.customerId ?? undefined

  return {
    ...(clientId ? { clientId } : {}),
    ...(parsed.rut ? { rut: parsed.rut } : {}),
    products
  }
}

// ---------- UPDATE ----------
/**
 * Solo permite cambiar el status; el resto lo maneja el sistema.
 */
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled'], {
    message: 'Invalid status value'
  })
}).strict()

// ---------- ESQUEMAS EXPLÍCITOS (si el servicio quiere usarlos directo) ----------
export const orderByRutSchema = byRut
export const orderByClientIdSchema = byClientId
export const orderByCustomerIdCompatSchema = byCustomerIdCompat
//orderProduct.schema.js: 
// src/schemas/orderProduct.schema.js
import { z } from 'zod'

// Crear item
export const createOrderProductSchema = z.object({
  orderId: z.string().uuid({ message: 'El orderId debe ser un UUID válido' }),
  productId: z.string().uuid({ message: 'El productId debe ser un UUID válido' }),
  quantity: z.coerce.number().int().positive({ message: 'La cantidad mínima es 1' })
}).strict()

// Actualizar cantidad (PUT/PATCH)
export const updateOrderProductSchema = z.object({
  quantity: z.coerce.number().int().positive({ message: 'La cantidad mínima es 1' })
}).strict()

// (Opcional; si ya usas validateUUID('id') no lo necesitas)
export const orderProductIdSchema = z.object({
  id: z.string().uuid({ message: 'El id debe ser un UUID válido' })
})
// product.schema.js
import { z } from 'zod'
import { rutWithDV } from './client.schema.js'

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

export const productSchema = z.object({
  name: z.string().min(1, { message: 'The name is required.' }).max(100, { message: 'Name too long' }),
  description: z.string().max(500, { message: 'Description too long' }).optional(),

  // Acepta "19990" (string) o 19990 (number)
  price: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'Price must be a number' }).min(0, { message: 'The price cannot be negative.' })
  ),

  // Acepta "50" o 50
  stock: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: 'Stock must be a number' }).int({ message: 'Stock must be an integer' })
  ),

  categoryId: z.string().regex(uuidRegex, { message: 'Category ID must be a valid UUID' }),

  // 👇 ahora puedes mandar UNO de los dos
  supplierId: z.string().regex(uuidRegex, { message: 'Supplier ID must be a valid UUID' }).optional(),
  supplierRut: rutWithDV.optional()
})
  .superRefine((data, ctx) => {
  // Debe venir supplierId o supplierRut
    if (!data.supplierId && !data.supplierRut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplier'],
        message: 'Provide supplierId or supplierRut'
      })
    }
  })
  .strict()

export const productUpdateSchema = productSchema
  .partial()
  .extend({
    replaceStock: z.boolean().optional()
  })
  .strict()
// reports.schema.js
}import { z } from 'zod'

const scheduleSchema = z.object({
  cron: z.string().min(1, 'Cron es obligatorio'),
  timezone: z.string().min(1, 'Timezone es obligatorio')
}).optional()

const filtersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional()
}).optional()

export const createReportSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  type: z.string().min(1, 'El tipo es obligatorio'),
  filters: filtersSchema,
  format: z.enum(['pdf', 'xls', 'dashboard']),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  schedule: scheduleSchema,
  deliveryMethod: z.string().optional(),
  sharedWith: z.array(z.string().uuid()).optional()
})

export const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  filters: filtersSchema,
  format: z.enum(['pdf', 'xls', 'dashboard']).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  schedule: scheduleSchema,
  deliveryMethod: z.string().optional(),
  sharedWith: z.array(z.string().uuid()).optional(),
  lastRunAt: z.date().optional(),
  executionTimeMs: z.number().int().optional()
})
// rut.schema.js
import { z } from 'zod'
import { normalizeRut, isValidRut } from '../utils/rut.js'

export const rutSchema = z.string()
  .nonempty({ message: 'RUT is required' })
  .transform((val) => normalizeRut(val))
  .refine((val) => isValidRut(val), { message: 'Invalid RUT' })
// supplier.schema.js
import { z } from 'zod'
import { isValidRut } from '../utils/rut.js'

// ——— Helpers ———
const trimOrEmpty = (v) => (v ?? '').toString().trim()

// Acepta con/sin guion y sin puntos; inserta guion si falta (último char es DV)
const normalizeRutFlexible = (rut) => {
  const raw = trimOrEmpty(rut).toUpperCase().replace(/\./g, '').replace(/\s+/g, '')
  if (!raw) return ''
  if (raw.includes('-')) return raw
  if (/^\d{7,8}[\dK]$/.test(raw)) {
    const body = raw.slice(0, -1)
    const dv = raw.slice(-1)
    return `${body}-${dv}`
  }
  return raw
}

const isNormalizedRutFormat = (value) =>
  /^(\d{7,8}-[\dK])$/i.test(String(value ?? ''))

const optionalString = (max) =>
  z.preprocess((v) => trimOrEmpty(v), z.string().max(max))

const optionalEmail = z.preprocess(
  (v) => trimOrEmpty(v),
  z.string().email().or(z.literal(''))
)

const optionalPhone = z.preprocess(
  (v) => trimOrEmpty(v),
  // Permite +, espacios, guiones y paréntesis, 7–20 caracteres
  z.string().refine(
    (s) => s === '' || /^\+?[0-9()\-\s]{7,20}$/.test(s),
    { message: 'Invalid phone number' }
  )
)

const optionalURL = z.preprocess(
  (v) => trimOrEmpty(v),
  z.string().url().or(z.literal(''))
)

// Status: en create default 'active'
const statusEnum = z.enum(['active', 'inactive'])
const statusForCreate = z.preprocess(
  (v) => (v == null || v === '' ? 'active' : v),
  statusEnum
)
// update validar si viene
const statusForUpdate = z.preprocess(
  (v) => (v === undefined ? undefined : v),
  statusEnum
).optional()

// ——— Schemas ———
export const supplierSchema = z
  .object({
    name: z.preprocess(
      (v) => trimOrEmpty(v),
      z.string().min(1, { message: 'Name is required' }).max(120)
    ),
    contactName: optionalString(100),
    email: optionalEmail,
    phone: optionalPhone,
    address: optionalString(200),
    website: optionalURL,
    rut: z
      .string()
      .transform(normalizeRutFlexible)
      .refine(isNormalizedRutFormat, { message: 'Invalid RUT format' })
      .refine(isValidRut, { message: 'Invalid RUT' }),
    paymentTerms: optionalString(200),
    categories: z.array(z.string().min(1)).optional().default([]),
    status: statusForCreate,
    notes: optionalString(1000)
  })
  .strict()

export const updateSupplierSchema = z
  .object({
    name: z
      .preprocess(
        (v) => (v === undefined ? undefined : trimOrEmpty(v)),
        z.string().min(1).max(120)
      )
      .optional(),
    contactName: optionalString(100).optional(),
    email: optionalEmail.optional(),
    phone: optionalPhone.optional(),
    address: optionalString(200).optional(),
    website: optionalURL.optional(),
    rut: z
      .string()
      .transform((v) => (v === undefined ? undefined : normalizeRutFlexible(v)))
      .refine(
        (v) => v === undefined || isNormalizedRutFormat(v),
        { message: 'Invalid RUT format' }
      )
      .refine(
        (v) => v === undefined || isValidRut(v),
        { message: 'Invalid RUT' }
      )
      .optional(),
    paymentTerms: optionalString(200).optional(),
    categories: z.array(z.string().min(1)).optional(),
    status: statusForUpdate,
    notes: optionalString(1000).optional()
  })
  .strict()
// user.schema.js
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
