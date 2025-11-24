import request from 'supertest'

let app
let signAccessToken
let ROLES
let User

const calcDv = (body) => {
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

const makeRut = (seed) => {
  const body = String(seed).padStart(8, '0').slice(-8)
  return `${body}-${calcDv(body)}`
}

const createAdminToken = async () => {
  const user = await User.create({
    username: `admin-${Date.now()}`,
    name: 'Admin Tester',
    email: `admin-${Date.now()}@test.cl`,
    password: 'Admin123!',
    role: ROLES.ADMIN
  })
  return signAccessToken({ id: user.id, role: user.role })
}

describe('Clients unique email among active', () => {
  let token

  beforeAll(async () => {
    ({ default: app } = await import('../../app.js'))
    ;({ signAccessToken } = await import('../../libs/jwt.js'))
    ;({ ROLES } = await import('../../config/roles.js'))
    const { models } = await import('../../models/index.js')
    User = models.User
  })

  beforeEach(async () => {
    token = await createAdminToken()
  })

  it('409 on same email when active; 201 after soft-delete', async () => {
    const C1 = { rut: makeRut(Date.now()), name: 'C1', email: 'mix@mix.com', address: 'X', phone: '+56912345678' }
    const c1 = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C1)
    expect(c1.status).toBe(201)
    const c1Id = c1.body.id

    const C2 = { rut: makeRut(Date.now() + 1), name: 'C2', email: 'mix@mix.com', address: 'Y', phone: '+56987654321' }
    const dup = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C2)
    expect(dup.status).toBe(409)

    const del = await request(app).delete(`/api/clients/${c1Id}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(200)

    const ok = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C2)
    expect(ok.status).toBe(201)
  })
})
