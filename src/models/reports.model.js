import { DataTypes, Model } from 'sequelize'

class Report extends Model {
  // 🔹 Inicialización del modelo
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
          set (value) {
            this.setDataValue('name', value?.trim() || '')
          }
        },
        description: {
          type: DataTypes.TEXT,
          set (value) {
            this.setDataValue('description', value?.trim() || '')
          }
        },
        type: { type: DataTypes.STRING, allowNull: false },
        filters: { type: DataTypes.JSONB },
        format: { type: DataTypes.ENUM('pdf', 'xls', 'dashboard'), allowNull: false },
        status: { type: DataTypes.ENUM('active', 'archived', 'draft'), defaultValue: 'active' },
        schedule: { type: DataTypes.JSONB },
        deliveryMethod: { type: DataTypes.STRING },
        sharedWith: { type: DataTypes.JSONB },
        lastRunAt: { type: DataTypes.DATE },
        executionTimeMs: { type: DataTypes.INTEGER },
        createdBy: { type: DataTypes.UUID, allowNull: true }
      },
      {
        sequelize,
        modelName: 'Report',
        tableName: 'reports',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at'
      }
    )
  }

  // 🔹 Relaciones
  static associate (models, schema) {
    // Report -> User (creador)
    this.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', schema })
  }
}

export default Report
