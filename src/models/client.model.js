// src/models/client.model.js
import { DataTypes, Model } from 'sequelize'

class Client extends Model {
  static initialize (sequelize) {
    Client.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      rut: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { is: /^[0-9]+-[0-9kK]{1}$/ }
      },
      address: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
      avatar: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    }, {
      sequelize,
      tableName: 'clients',
      timestamps: true,
      paranoid: true
    })
  }
}

export default Client
