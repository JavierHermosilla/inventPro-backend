import { sequelize } from '../../src/models/index.js'
import { v4 as uuid } from 'uuid'

const q = (sql, opts = {}) => sequelize.query(sql, { ...opts, raw: true })

describe('clients constraints', () => {
  const RUT = '99999999-9'
  afterAll(async () => {
    await q(`DELETE FROM inventpro_user.clients WHERE rut='${RUT}'`)
    await sequelize.close()
  })

  test('unique parcial por RUT (solo activos)', async () => {
    const id1 = uuid()
    await q(`
      INSERT INTO inventpro_user.clients (id, rut, name, email, address, phone)
      VALUES ('${id1}', '${RUT}', 'A', 'a@test.cl', 'x', '+5691')
    `)
    await expect(q(`
      INSERT INTO inventpro_user.clients (id, rut, name, email, address, phone)
      VALUES ('${uuid()}', '${RUT}', 'B', 'b@test.cl', 'y', '+5692')
    `)).rejects.toThrow()

    await q(`UPDATE inventpro_user.clients SET deleted_at = now() WHERE id='${id1}'`)
    await expect(q(`
      INSERT INTO inventpro_user.clients (id, rut, name, email, address, phone)
      VALUES ('${uuid()}', '${RUT}', 'C', 'c@test.cl', 'z', '+5693')
    `)).resolves.toBeTruthy()
  })
})
