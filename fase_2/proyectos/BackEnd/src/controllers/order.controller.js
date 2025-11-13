// src/controllers/order.controller.js
import { Op } from 'sequelize'
import { models } from '../models/index.js'
import { withReq } from '../utils/logger.js'
import { objectsToCsvLines } from '../utils/csv.js'
import { streamTablePdf } from '../utils/pdf.js'
import { streamExcel } from '../utils/xlsx.js'
import {
  createOrderService,
  updateOrderStatusService,
  deleteOrderService,
  listOrdersService,
  getOrderService,
  listOrdersByRutService
} from '../services/order.service.js'

const { Order, OrderProduct, Product, Client } = models

// ---- helpers ----
const logControllerError = (err, context) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[orders] ${context}`, err?.stack || err?.message || err)
  }
}

const sendError = (res, err, fallback = 'Internal server error', context = 'handler') => {
  const status = err?.status || 500
  if (status >= 500) logControllerError(err, context)
  res.status(status).json({ message: err?.message || fallback })
}
const toFinite = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
const capLimit = (v, def = 5000, hard = 50000) =>
  Math.max(1, Math.min(parseInt(v ?? process.env.CSV_MAX_ROWS ?? String(def), 10) || def, hard))
const safeMode = (m) => (m === 'items' ? 'items' : 'orders')

// =======================
// CRUD
// =======================
export async function listOrders (req, res) {
  try {
    const orders = await listOrdersService()
    return res.json(orders)
  } catch (err) {
    return sendError(res, err, 'Error listing orders.', 'listOrders')
  }
}

export async function listOrderById (req, res) {
  try {
    const order = await getOrderService(req.params.id)
    return res.json(order)
  } catch (err) {
    return sendError(res, err, 'Error fetching order.', 'listOrderById')
  }
}

export async function createOrder (req, res) {
  const log = withReq(req)
  try {
    const created = await createOrderService(req.body, req.user)
    log.info('[AUDIT] order.created', { userId: req.user?.id, orderId: created.id, total: created.totalAmount })
    return res.status(201).json({ message: 'Order created', order: created })
  } catch (err) {
    return sendError(res, err, 'Error creating order.', 'createOrder')
  }
}

export async function createOrderByRut (req, res) {
  const log = withReq(req)
  try {
    const created = await createOrderService(req.body, req.user)
    log.info('[AUDIT] order.created.byRut', { userId: req.user?.id, orderId: created.id })
    return res.status(201).json({ message: 'Order created by RUT', order: created })
  } catch (err) {
    return sendError(res, err, 'Error creating order by RUT.', 'createOrderByRut')
  }
}

export async function updateOrder (req, res) {
  const log = withReq(req)
  try {
    const updated = await updateOrderStatusService(req.params.id, req.body.status)
    log.info('[AUDIT] order.status.updated', { userId: req.user?.id, orderId: req.params.id, status: req.body.status })
    return res.json({ message: 'Order status updated', order: updated })
  } catch (err) {
    return sendError(res, err, 'Error updating order.', 'updateOrder')
  }
}

export async function deleteOrder (req, res) {
  const log = withReq(req)
  try {
    const result = await deleteOrderService(req.params.id)
    log.info('[AUDIT] order.deleted', { userId: req.user?.id, orderId: req.params.id })
    return res.json(result)
  } catch (err) {
    return sendError(res, err, 'Error deleting order.', 'deleteOrder')
  }
}

export async function listOrdersByRut (req, res) {
  try {
    const data = await listOrdersByRutService(req.params.rut)
    return res.json(data)
  } catch (err) {
    return sendError(res, err, 'Error listing orders by RUT.', 'listOrdersByRut')
  }
}

// =======================
// Export CSV (admin)
// GET /api/orders/export.csv?mode=orders|items&status=&clientRut=&start=&end=&minTotal=&maxTotal&limit=
// =======================
export async function exportOrdersCSV (req, res) {
  try {
    const { status, clientRut, start, end, limit } = req.query
    const mode = safeMode(String(req.query.mode).toLowerCase())
    const sep = String(req.query.sep || ';')
    const includeSepRow = String(req.query.excel).toLowerCase() === 'true'

    const CSV_MAX = Math.max(
      1,
      Math.min(parseInt(limit ?? process.env.CSV_MAX_ROWS ?? '5000', 10) || 5000, 50000)
    )

    const where = {}
    if (status) where.status = status

    if (start || end) {
      where.created_at = {}
      if (start) where.created_at[Op.gte] = new Date(start)
      if (end) where.created_at[Op.lte] = new Date(end)
    }

    const gte = toFinite(req.query.minTotal)
    const lte = toFinite(req.query.maxTotal)
    if (gte !== undefined || lte !== undefined) {
      where.totalAmount = {}
      if (gte !== undefined) where.totalAmount[Op.gte] = gte
      if (lte !== undefined) where.totalAmount[Op.lte] = lte
    }

    if (clientRut) {
      const cli = await Client.findOne({ where: { rut: clientRut } })
      if (!cli) return res.status(404).json({ message: 'Cliente no encontrado por RUT' })
      where.clientId = cli.id
    }

    const columnsOrders = [
      { key: 'order_id', header: 'Order ID' },
      { key: 'client_rut', header: 'Cliente RUT' },
      { key: 'client_name', header: 'Cliente' },
      { key: 'status', header: 'Estado' },
      { key: 'total_amount', header: 'Total ($)' },
      { key: 'is_backorder', header: 'Backorder' },
      { key: 'items_count', header: 'Ítems' },
      { key: 'created_at', header: 'Creado' },
      { key: 'updated_at', header: 'Actualizado' }
    ]

    const columnsItems = [
      { key: 'order_id', header: 'Order ID' },
      { key: 'status', header: 'Estado Orden' },
      { key: 'product_id', header: 'Producto ID' },
      { key: 'product_name', header: 'Producto' },
      { key: 'quantity', header: 'Cantidad' },
      { key: 'unit_price', header: 'Precio Unitario' },
      { key: 'line_total', header: 'Subtotal' },
      { key: 'created_at', header: 'Creado' }
    ]

    const columns = mode === 'items' ? columnsItems : columnsOrders
    const filename = `orders_${mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.write('\uFEFF')
    if (includeSepRow) res.write(`sep=${sep}\n`)
    res.write(objectsToCsvLines([], columns, { separator: sep })[0] + '\n')

    const batchSize = 1000
    let fetched = 0
    let offset = 0

    while (fetched < CSV_MAX) {
      const toFetch = Math.min(batchSize, CSV_MAX - fetched)

      const include = [{ model: Client, as: 'client', required: false }]
      if (mode === 'items') {
        include.push({
          model: OrderProduct,
          as: 'items',
          required: false,
          include: [{ model: Product, as: 'product', required: false }]
        })
      }

      const { rows } = await Order.findAndCountAll({
        where,
        include,
        order: [['created_at', 'DESC']],
        limit: toFetch,
        offset
      })

      if (!rows.length) break

      if (mode === 'items') {
        const itemRows = []
        for (const o of rows) {
          if (!o.items?.length) continue
          for (const it of o.items) {
            const unitPrice = Number(it.price ?? 0)
            const qty = Number(it.quantity ?? 0)
            itemRows.push({
              order_id: o.id,
              status: o.status,
              product_id: it.product?.id ?? it.productId,
              product_name: it.product?.name ?? '',
              quantity: qty,
              unit_price: unitPrice,
              line_total: unitPrice * qty,
              created_at: o.created_at?.toISOString?.() ?? o.created_at ?? ''
            })
          }
        }
        if (itemRows.length) {
          const lines = objectsToCsvLines(itemRows, columns, { separator: sep })
          for (let i = 1; i < lines.length; i++) res.write(lines[i] + '\n')
        }
      } else {
        const orderRows = rows.map(o => ({
          order_id: o.id,
          client_rut: o.client?.rut ?? '',
          client_name: o.client?.name ?? '',
          status: o.status,
          total_amount: Number(o.totalAmount ?? 0),
          is_backorder: o.isBackorder ? 'true' : 'false',
          items_count: Array.isArray(o.items) ? o.items.length : undefined,
          created_at: o.created_at?.toISOString?.() ?? o.created_at ?? '',
          updated_at: o.updated_at?.toISOString?.() ?? o.updated_at ?? ''
        }))
        const lines = objectsToCsvLines(orderRows, columns, { separator: sep })
        for (let i = 1; i < lines.length; i++) res.write(lines[i] + '\n')
      }

      fetched += rows.length
      offset += rows.length
      if (rows.length < toFetch) break
    }

    return res.end()
  } catch (err) {
    const status = err?.status || 500
    return res.status(status).json({ message: err?.message || 'Error exporting orders CSV.' })
  }
}

// =======================
// Export PDF/XLSX (admin)
// =======================
const ORDERS_XLSX_COLS = [
  { key: 'id', header: 'Order ID', width: 36 },
  {
    key: 'created_at',
    header: 'Creado',
    width: 24,
    map: r => r?.created_at?.toISOString?.() ?? r?.created_at ?? '',
    excel: { cast: 'date' }
  },
  { key: 'status', header: 'Estado', width: 16 },
  { key: 'client_rut', header: 'Cliente RUT', width: 18 },
  { key: 'client_name', header: 'Cliente', width: 30 },
  {
    key: 'items',
    header: 'Ítems',
    width: 10,
    excel: { cast: 'number', alignment: { horizontal: 'right' } }
  },
  {
    key: 'total',
    header: 'Total ($)',
    width: 16,
    map: r => Number(r.total ?? 0),
    excel: { cast: 'currency', alignment: { horizontal: 'right' } }
  }
]

const ORDERS_PDF_COLS = [
  { key: 'created_at', header: 'Date', width: 120, map: r => r?.created_at?.toISOString?.().slice(0, 19).replace('T', ' ') ?? '' },
  { key: 'id', header: 'Order ID', width: 220 },
  { key: 'client_name', header: 'Client', width: 220 },
  { key: 'status', header: 'Status', width: 90 },
  { key: 'items', header: 'Items', width: 70, align: 'right' },
  { key: 'total', header: 'Total', width: 100, align: 'right', map: r => Number(r.total ?? 0) }
]

const ITEMS_XLSX_COLS = [
  { key: 'order_id', header: 'Order ID', width: 36 },
  {
    key: 'created_at',
    header: 'Creado',
    width: 24,
    map: r => r?.created_at?.toISOString?.() ?? r?.created_at ?? '',
    excel: { cast: 'date' }
  },
  { key: 'client_rut', header: 'Cliente RUT', width: 18 },
  { key: 'client_name', header: 'Cliente', width: 30 },
  { key: 'product', header: 'Producto', width: 32 },
  {
    key: 'quantity',
    header: 'Cantidad',
    width: 12,
    excel: { cast: 'number', alignment: { horizontal: 'right' } }
  },
  {
    key: 'price',
    header: 'Precio Unitario',
    width: 14,
    map: r => Number(r.price ?? 0),
    excel: { cast: 'currency', alignment: { horizontal: 'right' } }
  },
  {
    key: 'subtotal',
    header: 'Subtotal',
    width: 16,
    map: r => Number(r.subtotal ?? 0),
    excel: { cast: 'currency', alignment: { horizontal: 'right' } }
  }
]

const ITEMS_PDF_COLS = [
  { key: 'order_id', header: 'Order', width: 180 },
  { key: 'client_name', header: 'Client', width: 220 },
  { key: 'product', header: 'Product', width: 260 },
  { key: 'quantity', header: 'Qty', width: 60, align: 'right' },
  { key: 'price', header: 'Price', width: 80, align: 'right' },
  { key: 'subtotal', header: 'Subtotal', width: 100, align: 'right' }
]

const buildOrderWhere = ({ clientId, status, search = '', start, end, minTotal, maxTotal, clientRut }) => {
  const where = {}
  if (clientId) where.clientId = clientId
  if (status) where.status = status
  if (start || end) {
    where.created_at = {}
    if (start) where.created_at[Op.gte] = new Date(start)
    if (end) where.created_at[Op.lte] = new Date(end)
  }
  const gte = toFinite(minTotal)
  const lte = toFinite(maxTotal)
  if (gte !== undefined || lte !== undefined) {
    where.totalAmount = {}
    if (gte !== undefined) where.totalAmount[Op.gte] = gte
    if (lte !== undefined) where.totalAmount[Op.lte] = lte
  }
  where._search = String(search).trim()
  where._clientRut = clientRut
  return where
}

async function fetchOrdersMode (where, MAX) {
  // resolver clientRut si viene
  if (where._clientRut) {
    const cli = await Client.findOne({ where: { rut: where._clientRut } })
    if (!cli) return []
    where.clientId = cli.id
  }
  const s = where._search
  const rows = await Order.findAll({
    where: {
      ...(where.clientId ? { clientId: where.clientId } : {}),
      ...(where.status ? { status: where.status } : {}),
      ...(where.created_at ? { created_at: where.created_at } : {}),
      ...(where.totalAmount ? { totalAmount: where.totalAmount } : {}),
      ...(s ? { id: { [Op.iLike]: `%${s}%` } } : {})
    },
    include: [
      { model: Client, as: 'client', attributes: ['id', 'rut', 'name'] },
      { model: OrderProduct, as: 'items', attributes: ['quantity', 'price'] }
    ],
    order: [['created_at', 'DESC']],
    limit: MAX
  })

  return rows.map(o => {
    const items = Array.isArray(o.items) ? o.items : []
    const total = items.reduce((a, it) => a + Number(it.price || 0) * Number(it.quantity || 0), 0)
    return {
      id: o.id,
      created_at: o.created_at,
      status: o.status,
      client_rut: o.client?.rut ?? '',
      client_name: o.client?.name ?? '',
      items: items.length,
      total
    }
  })
}

async function fetchItemsMode (where, MAX) {
  const s = where._search
  const rows = await OrderProduct.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        where: {
          ...(where.clientId ? { clientId: where.clientId } : {}),
          ...(where.status ? { status: where.status } : {}),
          ...(where.created_at ? { created_at: where.created_at } : {}),
          ...(where.totalAmount ? { totalAmount: where.totalAmount } : {})
        },
        include: [{ model: Client, as: 'client', attributes: ['rut', 'name'] }]
      },
      { model: Product, as: 'product', attributes: ['name'] }
    ],
    order: [['created_at', 'DESC']],
    limit: MAX
  })

  let data = rows.map(r => ({
    order_id: r.order?.id ?? '',
    created_at: r.order?.created_at ?? r.created_at,
    client_rut: r.order?.client?.rut ?? '',
    client_name: r.order?.client?.name ?? '',
    product: r.product?.name ?? '',
    quantity: Number(r.quantity || 0),
    price: Number(r.price || 0),
    subtotal: Number(r.quantity || 0) * Number(r.price || 0)
  }))

  if (s) {
    const needle = s.toLowerCase()
    data = data.filter(d =>
      String(d.order_id).toLowerCase().includes(needle) ||
      String(d.client_name).toLowerCase().includes(needle) ||
      String(d.product).toLowerCase().includes(needle)
    )
  }
  return data.slice(0, MAX)
}

export const exportOrdersPDF = async (req, res) => {
  try {
    const mode = safeMode(String(req.query.mode).toLowerCase())
    const where = buildOrderWhere(req.query)
    const MAX = capLimit(req.query.limit)

    const rows = mode === 'items'
      ? await fetchItemsMode(where, MAX)
      : await fetchOrdersMode(where, MAX)

    streamTablePdf(res, rows, {
      title: mode === 'items' ? 'Order Items' : 'Orders',
      filename: `orders_${mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`,
      columns: mode === 'items' ? ITEMS_PDF_COLS : ORDERS_PDF_COLS
    })
  } catch (err) {
    return sendError(res, err, 'Error exportando Orders PDF.', 'exportOrdersPDF')
  }
}

export const exportOrdersXLSX = async (req, res) => {
  try {
    const mode = safeMode(String(req.query.mode).toLowerCase())
    const where = buildOrderWhere(req.query)
    const MAX = capLimit(req.query.limit)

    const rows = mode === 'items'
      ? await fetchItemsMode(where, MAX)
      : await fetchOrdersMode(where, MAX)

    await streamExcel(res, rows, {
      filename: `orders_${mode}_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`,
      sheetName: mode === 'items' ? 'Order Items' : 'Orders',
      columns: mode === 'items' ? ITEMS_XLSX_COLS : ORDERS_XLSX_COLS
    })
  } catch (err) {
    return sendError(res, err, 'Error exportando Orders XLSX.', 'exportOrdersXLSX')
  }
}
