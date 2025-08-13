import request from 'supertest'
import app from '../app.js'
import User from '../models/user.model.js'

let adminToken
let userToken
let adminId
let userId

const adminData = {
  username: 'adminUser',
  name: 'Administrador',
  email: 'admin@test.com',
  password: 'Admin123!',
  phone: '+56912345678',
  role: 'admin'
}

const userData = {
  username: 'normalUser',
  name: 'Usuario Normal',
  email: 'user@test.com',
  password: 'User123!',
  phone: '+56987654321',
  role: 'user'
}

// 🔹 Setup inicial: crear usuarios y obtener tokens
beforeEach(async () => {
  await User.deleteMany({})

  const admin = await User.create(adminData)
  const user = await User.create(userData)
  adminId = admin._id
  userId = user._id

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: adminData.email, password: adminData.password })
  adminToken = adminRes.body.token

  const userRes = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password })
  userToken = userRes.body.token
})

// 🔹 Tests
describe('User API', () => {

  test('Admin puede crear usuario', async () => {
    const newUser = {
      username: 'nuevoUser',
      name: 'Nuevo Usuario',
      email: 'nuevo@test.com',
      password: 'Nuevo123!',
      phone: '+56911112222',
      role: 'user'
    }

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser)

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe(newUser.email)
  })

  test('Usuario normal no puede crear usuario', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        username: 'failUser',
        name: 'Falla Usuario',
        email: 'fail@test.com',
        password: 'Fail123!',
        phone: '+56933334444',
        role: 'user'
      })

    expect(res.status).toBe(403)
  })

  test('No puede crear con email duplicado', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...userData })

    expect(res.status).toBe(400)
  })

  test('Admin puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.users)).toBe(true)
    expect(res.body.users.length).toBeGreaterThanOrEqual(2)
  })

  test('Usuario normal no puede listar usuarios', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.status).toBe(403)
  })

  test('Admin puede actualizar usuario', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Usuario Actualizado' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Usuario Actualizado')
  })

  test('Usuario puede actualizar su propio perfil', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Self Update' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Self Update')
  })

  test('Usuario no puede actualizar otro usuario', async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hack' })

    expect(res.status).toBe(403)
  })

  test('Admin puede eliminar usuario', async () => {
    const newUser = await User.create({
      username: 'deleteUser',
      name: 'Eliminar Usuario',
      email: 'delete@test.com',
      password: 'Delete123!',
      phone: '+56955556666',
      role: 'user'
    })

    const res = await request(app)
      .delete(`/api/users/${newUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('delete@test.com')
  })

  test('Usuario normal no puede eliminar usuario', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.status).toBe(403)
  })
})
