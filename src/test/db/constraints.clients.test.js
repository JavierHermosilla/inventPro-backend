import { v4 as uuid } from 'uuid'
import { sequelize } from '../../models/index.js'

const schema = process.env.DB_SCHEMA || 'inventpro_user'
const tbl = (name) => `"${schema}"."${name}"`
const q = (sql, opts = {}) => sequelize.query(sql, { ...opts, raw: true })

describe('clients constraints', () => {
  const RUT = '99999999-9'

  test('unique parcial por RUT (solo activos)', async () => {
    const id1 = uuid()
    await q(`
      INSERT INTO ${tbl('clients')} (id, rut, name, email, address, phone)
      VALUES ('${id1}', '${RUT}', 'A', 'a@test.cl', 'x', '+5691')
    `)
    await expect(q(`
      INSERT INTO ${tbl('clients')} (id, rut, name, email, address, phone)
      VALUES ('${uuid()}', '${RUT}', 'B', 'b@test.cl', 'y', '+5692')
    `)).rejects.toThrow()

    await q(`UPDATE ${tbl('clients')} SET deleted_at = now() WHERE id='${id1}'`)
    await expect(q(`
      INSERT INTO ${tbl('clients')} (id, rut, name, email, address, phone)
      VALUES ('${uuid()}', '${RUT}', 'C', 'c@test.cl', 'z', '+5693')
    `)).resolves.toBeTruthy()
  })
})
