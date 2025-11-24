import request from 'supertest'
import { v4 as uuid } from 'uuid'

let app
let signAccessToken
let ROLES
let User
let Supplier
let Category
let Product
let ManualInventory

const uid = () => Math.random().toString(36).slice(2, 10)

const calcRutDv = (body) => {
  let sum = 0
  let mult = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const rest = 11 - (sum % 11)
  if (rest === 11) return '0'
  if (rest === 10) return 'K'
  return String(rest)
}

const makeRut = () => {
  const body = String(Date.now()).slice(-8)
  return `${body}-${calcRutDv(body)}`
}

const createUserWithRole = async (role) => {
  const user = await User.create({
    username: `${role}-${uid()}`,
    name: `${role} tester`,
    email: `${role}-${uid()}@test.cl`,
    password: 'Passw0rd!',
    role
  })
  const token = signAccessToken({ id: user.id, role: user.role })
  return { user, token }
}

const createSupplier = async () => {
  return Supplier.create({
    name: `Supplier-${uid()}`,
    rut: makeRut(),
    email: `sup-${uid()}@test.cl`
  })
}

const createCategory = async () => {
  return Category.create({
    name: `category-${uid()}`,
    description: 'Categoria de prueba'
  })
}

const createProduct = async (overrides = {}) => {
  const supplier = overrides.supplierId ? null : await createSupplier()
  const category = overrides.categoryId ? null : await createCategory()

  return Product.create({
    name: overrides.name || `Producto-${uid()}`,
    price: overrides.price ?? 1000,
    stock: overrides.stock ?? 10,
    supplierId: overrides.supplierId ?? supplier.id,
    categoryId: overrides.categoryId ?? category.id
  })
}

describe('Manual Inventory API (mobile ready)', () => {
  let admin, adminToken, nonAdminToken, product

  beforeAll(async () => {
    ({ default: app } = await import('../app.js'))
    ;({ signAccessToken } = await import('../libs/jwt.js'))
    ;({ ROLES } = await import('../config/roles.js'))
    const { models } = await import('../models/index.js')
    User = models.User
    Supplier = models.Supplier
    Category = models.Category
    Product = models.Product
    ManualInventory = models.ManualInventory
  })

  beforeEach(async () => {
    const adminRes = await createUserWithRole(ROLES.ADMIN)
    admin = adminRes.user
    adminToken = adminRes.token
    const nonAdminRes = await createUserWithRole(ROLES.BODEGUERO)
    nonAdminToken = nonAdminRes.token
    product = await createProduct({ stock: 10 })
  })

  describe('POST /api/manual-inventory', () => {
    test('admin puede aumentar stock y obtiene resumen', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'increase', quantity: 5, reason: 'Reabastecimiento' })
        .expect(201)

      expect(res.body).toMatchObject({
        message: 'Manual inventory adjustment created.',
        newStock: 15,
        product: { id: product.id, name: product.name, stock: 15 },
        adjustment: {
          productId: product.id,
          userId: admin.id,
          type: 'increase',
          quantity: 5,
          reason: 'Reabastecimiento'
        }
      })

      const refreshed = await Product.findByPk(product.id)
      expect(Number(refreshed.stock)).toBe(15)
    })

    test('rechaza decrease sin reason explícito', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'decrease', quantity: 2 })
        .expect(400)

      expect(res.body.errors?.[0]?.path).toBe('reason')
    })

    test('bloquea dejar stock negativo cuando la política lo prohíbe', async () => {
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'decrease', quantity: 50, reason: 'Ajuste' })
        .expect(409)

      expect(res.body.message).toMatch(/insufficient stock/i)
    })

    test('404 si el producto no existe', async () => {
      const missingId = uuid()
      const res = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: missingId, type: 'increase', quantity: 1, reason: 'Test' })
        .expect(404)

      expect(res.body.message).toMatch(/product not found/i)
    })

    test('requiere rol admin y token', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .send({ productId: product.id, type: 'increase', quantity: 1, reason: 'Test' })
        .expect(401)

      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ productId: product.id, type: 'increase', quantity: 1, reason: 'Test' })
        .expect(403)
    })
  })

  describe('GET /api/manual-inventory', () => {
    test('lista ajustes con info de producto y usuario', async () => {
      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'increase', quantity: 2, reason: 'Carga inicial' })
        .expect(201)

      await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'decrease', quantity: 1, reason: 'Corrección' })
        .expect(201)

      const res = await request(app)
        .get('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body).toMatchObject({
        page: 1,
        pages: 1
      })
      expect(res.body.records).toHaveLength(2)
      expect(res.body.records[0]).toMatchObject({
        productId: product.id,
        performedBy: expect.objectContaining({ id: admin.id })
      })
    })
  })

  describe('GET /api/manual-inventory/:id', () => {
    test('recupera un ajuste con sus relaciones', async () => {
      const created = await request(app)
        .post('/api/manual-inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productId: product.id, type: 'increase', quantity: 3, reason: 'Reconteo' })
        .expect(201)

      const res = await request(app)
        .get(`/api/manual-inventory/${created.body.adjustmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.id).toBe(created.body.adjustmentId)
      expect(res.body.product?.id).toBe(product.id)
      expect(res.body.performedBy?.id).toBe(admin.id)
    })

    test('400 con UUID inválido', async () => {
      const res = await request(app)
        .get('/api/manual-inventory/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(res.body.message).toMatch(/Invalid UUID/i)
    })
  })

  describe('DELETE /api/manual-inventory/:id', () => {
    test('solo admin puede eliminar un ajuste', async () => {
      const created = await ManualInventory.create({
        productId: product.id,
        userId: admin.id,
        type: 'increase',
        quantity: 1,
        reason: 'Temporal'
      })

      await request(app)
        .delete(`/api/manual-inventory/${created.id}`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403)

      await request(app)
        .delete(`/api/manual-inventory/${created.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const stillExists = await ManualInventory.findByPk(created.id)
      expect(stillExists).toBeNull()
    })
  })
})
