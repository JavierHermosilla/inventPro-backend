// src/schemas/order.schema.js
import { z } from 'zod'
import { rutWithDV } from './client.schema.js'

// ---------- helpers ----------
const uuid = z.string().uuid({ message: 'Invalid UUID format' })

// coerción robusta: "2" -> 2, "2.9" -> 2
const quantitySchema = z.preprocess(
  (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : v
  },
  z.number()
    .int({ message: 'Quantity must be an integer' })
    .min(1, { message: 'Quantity must be greater than 0' })
    .max(100000, { message: 'Quantity too large' })
)

// Un item válido: SOLO productId + quantity (no se permite precio desde el cliente)
const lineItemSchema = z.object({
  productId: uuid,
  quantity: quantitySchema
}).strict()

// Campos opcionales seguros (si no los quieres, quítalos aquí y evita "Unrecognized key")
const optionalFieldsSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  reference: z.string().trim().max(100).optional(),
  channel: z.enum(['web', 'pos', 'api']).optional()
}).partial().strict()

// ---------- CREATE ----------
/**
 * Reglas:
 *  - EXACTAMENTE uno: clientId XOR rut
 *  - products: array >= 1, <= 100
 *  - Se permiten opcionales seguros (notes/reference/channel)
 */
export const orderCreateSchema = z.object({
  clientId: uuid.optional(),
  rut: z.preprocess(
    // normaliza rut: quita puntos y recorta espacios (DV con guion ya lo valida rutWithDV)
    v => (typeof v === 'string' ? v.replace(/\./g, '').trim() : v),
    rutWithDV
  ).optional(),
  products: z.array(lineItemSchema)
    .min(1, { message: 'At least one product is required' })
    .max(100, { message: 'Too many items' }),
  // opcionales
  ...optionalFieldsSchema.shape
})
  // EXACTAMENTE uno de los dos
  .refine(v => Boolean(v.clientId) !== Boolean(v.rut), {
    message: 'Provide exactly one of clientId or rut',
    path: ['clientId']
  })
  .strict()

/**
 * Normaliza el payload de creación:
 * - Devuelve SOLO { clientId? | rut?, products, notes?, reference?, channel? }
 * - Quantity garantizada como entero
 * - Colapsa productId duplicados sumando quantity
 */
export function normalizeOrderCreate (input) {
  const parsed = orderCreateSchema.parse(input)

  // colapsar duplicados
  const agg = new Map()
  for (const p of parsed.products) {
    const key = p.productId
    const q = Math.trunc(Number(p.quantity))
    if (!agg.has(key)) agg.set(key, 0)
    agg.set(key, agg.get(key) + q)
  }

  // construye array limpio, descarta cantidades <= 0 por si viniera basura
  const products = Array.from(agg, ([productId, quantity]) => ({ productId, quantity }))
    .filter(p => p.quantity > 0)

  const out = {
    ...(parsed.clientId ? { clientId: parsed.clientId } : {}),
    ...(parsed.rut ? { rut: parsed.rut } : {}),
    products,
    ...(parsed.notes ? { notes: parsed.notes.trim() } : {}),
    ...(parsed.reference ? { reference: parsed.reference.trim() } : {}),
    ...(parsed.channel ? { channel: parsed.channel } : {})
  }

  return out
}

// ---------- UPDATE ----------
export const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled'], {
    message: 'Invalid status value'
  })
}).strict()

// (Opcionales directos si los usas en endpoints separados)
export const orderByRutSchema = z.object({
  rut: rutWithDV,
  products: z.array(lineItemSchema).min(1).max(100)
}).strict()

export const orderByClientIdSchema = z.object({
  clientId: uuid,
  products: z.array(lineItemSchema).min(1).max(100)
}).strict()
