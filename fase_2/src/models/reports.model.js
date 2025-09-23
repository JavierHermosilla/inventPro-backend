import { DataTypes, Model } from 'sequelize'

class Report extends Model {
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
          validate: { notEmpty: { msg: 'El nombre del reporte es obligatorio' } },
          set (value) {
            this.setDataValue('name', String(value ?? '').trim())
          }
        },

        description: {
          type: DataTypes.TEXT,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('description', v || null)
          }
        },

        type: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { notEmpty: { msg: 'El tipo es obligatorio' } }
        },

        filters: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        },

        format: {
          // ⚠️ Asegúrate de que coincida con tu ENUM real en la BD
          type: DataTypes.ENUM('pdf', 'xls', 'dashboard'),
          allowNull: false
        },

        status: {
          type: DataTypes.ENUM('active', 'archived', 'draft'),
          allowNull: false,
          defaultValue: 'active'
        },

        schedule: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {}
        },

        deliveryMethod: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'delivery_method',
          set (value) {
            const v = value == null ? null : String(value).trim().toLowerCase()
            this.setDataValue('deliveryMethod', v || null)
          }
        },

        sharedWith: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: [],
          field: 'shared_with'
        },

        lastRunAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_run_at'
        },

        executionTimeMs: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'execution_time_ms',
          validate: { min: 0 }
        },

        createdBy: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'created_by'
        }
      },
      {
        sequelize,
        modelName: 'Report',
        tableName: 'reports',
        schema: 'inventpro_user',

        timestamps: true,
        paranoid: false, // suele no ser necesario en “reports”; cámbialo si de verdad usas deleted_at
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'

        // ❌ sin indexes aquí; los dejaremos en migraciones
      }
    )
  }

  static associate (models) {
    Report.belongsTo(models.User, {
      as: 'creator',
      foreignKey: { name: 'createdBy', field: 'created_by', allowNull: false }
    })
  }
}

export default Report
