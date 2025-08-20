import Client from '../models/client.model.js'

export const createClient = async (req, res) => {
  const userIP = req.clientIP || req.ip // IP del cliente

  try {
    // Validar si el cliente ya existe
    const existingClient = await Client.findOne({ rut: req.body.rut })
    if (existingClient) {
      console.warn(`Intento de crear cliente duplicado: ${req.body.rut}`, { IP: userIP })
      return res.status(409).json({ message: 'Cliente con este RUT ya existe' })
    }

    const client = await Client.create(req.body)
    console.log('Cliente creado correctamente:', client, { IP: userIP })
    res.status(201).json(client)
  } catch (err) {
    console.error('Error creando cliente:', err, { IP: userIP })

    if (err.code === 11000) {
      return res.status(409).json({ message: 'Cliente con este RUT ya existe' })
    }

    res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export
const listClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 })
    res.json(clients)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const listClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' })
    res.json(client)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id)
    if (!client) return res.status(404).json({ message: 'cliente no encontrado' })
    res.json({ message: 'Cliente eliminado' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
