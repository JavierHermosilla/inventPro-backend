import request from 'supertest'
import app from '../../app.js'

describe('Clients unique email among active', () => {
  let token, c1Id

  beforeEach(async () => {
    const r = await request(app).post('/api/auth/login')
      .send({ email: 'admin@inventpro.cl', password: 'Admin123!' })
    token = r.body.accessToken || r.body.token
  })

  it('409 on same email when active; 201 after soft-delete', async () => {
    const C1 = { rut: '22222222-2', name: 'C1', email: 'mix@mix.com', address: 'X', phone: '+56912345678' }
    const c1 = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C1)
    expect(c1.status).toBe(201)
    c1Id = c1.body.id

    const C2 = { rut: '33333333-3', name: 'C2', email: 'mix@mix.com', address: 'Y', phone: '+56987654321' }
    const dup = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C2)
    expect(dup.status).toBe(409)

    const del = await request(app).delete(`/api/clients/${c1Id}`).set('Authorization', `Bearer ${token}`)
    expect(del.status).toBe(200)

    const ok = await request(app).post('/api/clients').set('Authorization', `Bearer ${token}`).send(C2)
    expect(ok.status).toBe(201)
  })
})
