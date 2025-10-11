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
