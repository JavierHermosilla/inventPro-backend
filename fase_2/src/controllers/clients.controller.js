import { Op, col } from 'sequelize'
import Client from '../models/client.model.js'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js'

// Crear cliente
export const createClient = async (req, res) => {
  try {
    const validatedData = createClientSchema.parse(req.body)

    const { rut, email } = validatedData

    const existing = await Client.findOne({
      where: { [Op.or]: [{ rut }, { email }] }
    })
    if (existing) {
      return res.status(409).json({ message: 'Cliente con este RUT o email ya existe' })
    }

    const client = await Client.create(validatedData)
    res.status(201).json(client)
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos inválidos', errors: err.errors })
    }
    res.status(500).json({ message: 'Error interno', error: err.message })
  }
}

// Listar clientes
export const listClients = async (_req, res) => {
  try {
    const clients = await Client.findAll({ order: [[col('created_at'), 'DESC']] })
    res.json(clients)
  } catch (err) {
    res.status(500).json({ message: 'Error interno', error: err.message })
  }
}

// Obtener cliente por ID
export const listClientById = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id)
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ message: 'Error interno', error: err.message })
  }
}

// Actualizar cliente
export const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id)
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })

    const validatedData = updateClientSchema.parse(req.body)
    await client.update(validatedData)
    res.json(client)
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos inválidos', errors: err.errors })
    }
    res.status(500).json({ message: 'Error interno', error: err.message })
  }
}

// Eliminar cliente (soft delete)
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id)
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })

    await client.destroy()
    res.json({ message: 'Cliente eliminado correctamente' })
  } catch (err) {
    res.status(500).json({ message: 'Error interno', error: err.message })
  }
}
