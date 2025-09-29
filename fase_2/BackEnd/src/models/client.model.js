// src/models/client.model.js
import { DataTypes, Model } from 'sequelize'

// Normaliza y valida RUT: 12345678-9 (DV con módulo 11)
const RUT_REGEX = /^(\d{7,8})-([\dkK])$/

function sanitizeRut (value) {
  return String(value ?? '')
    .replace(/\./g, '') // quita puntos
    .toUpperCase()
    .trim()
}

function calcRutDv (bodyDigits) {
  // módulo 11 con factores 2..7
  let sum = 0
  let factor = 2
  for (let i = bodyDigits.length - 1; i >= 0; i--) {
    sum += Number(bodyDigits[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const rest = 11 - (sum % 11)
  if (rest === 11) return '0'
  if (rest === 10) return 'K'
  return String(rest)
}

function isValidRut (value) {
  const v = sanitizeRut(value)
  const m = v.match(RUT_REGEX)
  if (!m) return false
  const [, body, dv] = m
  return calcRutDv(body) === dv.toUpperCase()
}

class Client extends Model {
  static initialize (sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },

        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notNull: { msg: 'El nombre del cliente es obligatorio' },
            notEmpty: { msg: 'El nombre del cliente no puede estar vacío' }
          },
          set (value) {
            this.setDataValue('name', String(value ?? '').trim())
          }
        },

        rut: {
          type: DataTypes.STRING, // en BD hay check + índice único parcial
          allowNull: false,
          validate: {
            notEmpty: { msg: 'El RUT es obligatorio' },
            isNormalizedFormat (value) {
              const v = sanitizeRut(value)
              if (!RUT_REGEX.test(v)) {
                throw new Error('RUT inválido (usa 12345678-9, sin puntos)')
              }
              if (!isValidRut(v)) {
                throw new Error('RUT inválido: dígito verificador no coincide')
              }
            }
          },
          set (value) {
            this.setDataValue('rut', sanitizeRut(value))
          }
        },

        address: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { notEmpty: { msg: 'La dirección es obligatoria' } },
          set (value) {
            this.setDataValue('address', String(value ?? '').trim())
          }
        },

        phone: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'El teléfono es obligatorio' },
            is: {
              args: /^\+?[0-9()\-\s]{7,20}$/,
              msg: 'Teléfono inválido'
            }
          },
          set (value) {
            this.setDataValue('phone', String(value ?? '').trim())
          }
        },

        // En BD es CITEXT (case-insensitive). Aquí lo normalizamos en minúsculas.
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'El email es obligatorio' },
            isEmail: { msg: 'Email inválido' }
          },
          set (value) {
            this.setDataValue('email', String(value ?? '').trim().toLowerCase())
          }
        },

        avatar: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('avatar', v || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Client',
        tableName: 'clients',

        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'

        // ⚠️ No declaramos índices/unique aquí: ya existen en migraciones (incluidos los parciales)
        // indexes: []
      }
    )
  }

  static associate (models) {
    // Si tu Order define clientId/client_id:
    // Client.hasMany(models.Order, {
    //   as: 'orders',
    //   foreignKey: { name: 'clientId', field: 'client_id', allowNull: true },
    //   onUpdate: 'CASCADE',
    //   onDelete: 'SET NULL'
    // })
  }
}

export default Client
