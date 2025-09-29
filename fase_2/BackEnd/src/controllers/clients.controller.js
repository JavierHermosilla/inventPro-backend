// src/controllers/client.controller.js
import {
  createClientService,
  listClientsService,
  getClientByIdService,
  updateClientService,
  deleteClientService
} from '../services/client.service.js'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js'

export const createClient = async (req, res) => {
  try {
    const data = createClientSchema.parse(req.body)
    const client = await createClientService(data)
    return res.status(201).json(client)
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos inválidos', errors: err.errors })
    }
    return res.status(err.status || 500).json({ message: err.message || 'Error interno' })
  }
}

export const listClients = async (req, res) => {
  try {
    const result = await listClientsService(req.query)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ message: 'Error interno', error: err.message })
  }
}

export const listClientById = async (req, res) => {
  try {
    const client = await getClientByIdService(req.params.id)
    return res.json(client)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Error interno' })
  }
}

export const updateClient = async (req, res) => {
  try {
    const data = updateClientSchema.parse(req.body)
    const client = await updateClientService(req.params.id, data)
    return res.json(client)
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Datos inválidos', errors: err.errors })
    }
    return res.status(err.status || 500).json({ message: err.message || 'Error interno' })
  }
}

export const deleteClient = async (req, res) => {
  try {
    const r = await deleteClientService(req.params.id)
    return res.json(r)
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || 'Error interno' })
  }
}
