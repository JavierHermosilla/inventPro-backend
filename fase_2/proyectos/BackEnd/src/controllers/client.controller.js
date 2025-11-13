// src/controllers/client.controller.js
import {
  createClientService,
  listClientsService,
  getClientByIdService,
  updateClientService,
  deleteClientService
} from '../services/client.service.js'

import { models } from '../models/index.js'
import { withReq } from '../utils/logger.js'
import { objectsToCsvLines } from '../utils/csv.js'
import { streamTablePdf } from '../utils/pdf.js'
import { streamExcel } from '../utils/xlsx.js'
import { Op } from 'sequelize'

const { Client } = models

// ---------- helpers ----------
const sendError = (res, err, fallback = 'Error interno') => {
  const status = err?.status || 500
  res.status(status).json({ message: err?.message || fallback })
}

const toInt = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : def
}

const capLimit = (v, def = 5000, hard = 50000) =>
  Math.max(1, Math.min(parseInt(v ?? process.env.CSV_MAX_ROWS ?? String(def), 10) || def, hard))

/** Normaliza email a lowercase sin espacios. */
const normalizeEmail = (v) =>
  typeof v === 'string' ? v.trim().toLowerCase() : v

/**
 * Normaliza teléfono de Chile a formato +569XXXXXXXX.
 * Acepta: "+569XXXXXXXX" | "569XXXXXXXX" | "9XXXXXXXX" | "09XXXXXXXX" (con o sin espacios/guiones).
 * Si no calza, devuelve el original (dejamos la validación a Zod).
 */
const normalizePhoneCL = (v) => {
  if (typeof v !== 'string') return v
  const only = v.replace(/[^\d]/g, '') // quita todo salvo dígitos
  // casos: 9XXXXXXXX (9 + 8 dígitos), 569XXXXXXXX, 09XXXXXXXX
  const digits = only
  if (digits.length === 9 && digits.startsWith('9')) return `+56${digits}`
  if (digits.length === 11 && digits.startsWith('569')) return `+${digits}`
  if (digits.length === 10 && digits.startsWith('09')) return `+569${digits.slice(1)}`
  return v.trim() // si no coincide, retorna “lo mejor posible”
}

/** Normaliza payload de entrada (defensa extra, además del esquema Zod). */
const normalizePayload = (body = {}) => {
  const out = { ...body }
  if (out.email) out.email = normalizeEmail(out.email)
  if (out.phone) out.phone = normalizePhoneCL(out.phone)
  return out
}

const buildWhere = ({ search = '' }) => {
  const s = String(search).trim()
  if (!s) return {}
  return {
    [Op.or]: [
      { name: { [Op.iLike]: `%${s}%` } },
      { rut: { [Op.iLike]: `%${s}%` } },
      { email: { [Op.iLike]: `%${s}%` } }
    ]
  }
}

// Columnas export
const XLSX_COLS = [
  { key: 'id', header: 'ID', width: 36 },
  { key: 'rut', header: 'RUT', width: 22 },
  { key: 'name', header: 'Nombre', width: 32 },
  { key: 'email', header: 'Email', width: 34 },
  { key: 'phone', header: 'Teléfono', width: 20 },
  { key: 'address', header: 'Dirección', width: 40 },
  {
    key: 'created_at',
    header: 'Creado',
    width: 24,
    map: r => r?.created_at?.toISOString?.() ?? r?.created_at ?? '',
    excel: { cast: 'date' }
  },
  {
    key: 'updated_at',
    header: 'Actualizado',
    width: 24,
    map: r => r?.updated_at?.toISOString?.() ?? r?.updated_at ?? '',
    excel: { cast: 'date' }
  }
]

const PDF_COLS = [
  { key: 'name', header: 'Name', width: 160 },
  { key: 'rut', header: 'RUT', width: 120 },
  { key: 'email', header: 'Email', width: 200 },
  { key: 'phone', header: 'Phone', width: 120 },
  { key: 'address', header: 'Address', width: 220 }
]

// =============== CRUD JSON ===============
export const createClient = async (req, res) => {
  const log = withReq(req)
  try {
    const payload = normalizePayload(req.body)
    const client = await createClientService(payload)
    log.info('[AUDIT] client.created', {
      userId: req.user?.id,
      clientId: client.id,
      clientRut: client.rut
    })
    return res.status(201).json(client)
  } catch (err) {
    return sendError(res, err, 'Error al crear cliente')
  }
}

export const listClients = async (req, res) => {
  try {
    // CSV inline (?export=csv)
    if (String(req.query.export).toLowerCase() === 'csv') {
      const CSV_MAX = Math.max(
        1,
        Math.min(
          toInt(req.query.limit, toInt(process.env.CSV_MAX_ROWS, 5000)) || 5000,
          50000
        )
      )

      const where = buildWhere(req.query)
      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Nombre' },
        { key: 'rut', header: 'RUT' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Teléfono' },
        { key: 'address', header: 'Dirección' },
        { key: 'created_at', header: 'Creado', map: r => r?.created_at?.toISOString?.() ?? r?.created_at ?? '' }
      ]

      const filename = `clients_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      const sep = String(req.query.sep || ';')
      res.write('\uFEFF')
      res.write(`sep=${sep}\n`)
      res.write(objectsToCsvLines([], columns, { separator: sep })[0] + '\n')

      const batchSize = 1000
      let fetched = 0
      let offset = 0

      while (fetched < CSV_MAX) {
        const toFetch = Math.min(batchSize, CSV_MAX - fetched)
        const rows = await Client.findAll({
          where,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'name', 'rut', 'email', 'phone', 'address', 'created_at'],
          limit: toFetch,
          offset,
          raw: true
        })
        if (!rows.length) break

        const lines = objectsToCsvLines(rows, columns, { separator: sep })
        for (let i = 1; i < lines.length; i++) res.write(lines[i] + '\n')

        fetched += rows.length
        offset += rows.length
        if (rows.length < toFetch) break
      }

      return res.end()
    }

    // JSON paginado
    const result = await listClientsService(req.query)
    return res.json(result)
  } catch (err) {
    return sendError(res, err, 'Error al listar clientes')
  }
}

export const listClientById = async (req, res) => {
  try {
    const client = await getClientByIdService(req.params.id)
    return res.json(client)
  } catch (err) {
    return sendError(res, err, 'Error al obtener cliente')
  }
}

export const updateClient = async (req, res) => {
  const log = withReq(req)
  try {
    const payload = normalizePayload(req.body)
    const client = await updateClientService(req.params.id, payload)
    log.info('[AUDIT] client.updated', {
      userId: req.user?.id,
      clientId: client.id,
      clientRut: client.rut
    })
    return res.json(client)
  } catch (err) {
    return sendError(res, err, 'Error al actualizar cliente')
  }
}

export const deleteClient = async (req, res) => {
  const log = withReq(req)
  try {
    const r = await deleteClientService(req.params.id)
    log.info('[AUDIT] client.deleted', {
      userId: req.user?.id,
      clientId: req.params.id
    })
    return res.json(r)
  } catch (err) {
    return sendError(res, err, 'Error al eliminar cliente')
  }
}

// =============== EXPORT PDF/XLSX ===============
export const exportClientsPDF = async (req, res) => {
  try {
    const where = buildWhere(req.query)
    const MAX = capLimit(req.query.limit)
    const rows = await Client.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: MAX,
      raw: true
    })
    streamTablePdf(res, rows, {
      title: 'Clients',
      filename: `clients_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`,
      columns: PDF_COLS
    })
  } catch (err) {
    return sendError(res, err, 'Error exportando Clients PDF')
  }
}

export const exportClientsXLSX = async (req, res) => {
  try {
    const where = buildWhere(req.query)
    const MAX = capLimit(req.query.limit)
    const rows = await Client.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: MAX,
      raw: true
    })
    await streamExcel(res, rows, {
      filename: `clients_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`,
      sheetName: 'Clients',
      columns: XLSX_COLS
    })
  } catch (err) {
    return sendError(res, err, 'Error exportando Clients XLSX')
  }
}
