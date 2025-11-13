// src/controllers/product.controller.js
import {
  createProductService,
  listProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService
} from '../services/product.service.js'

import { models } from '../models/index.js'
import { withReq } from '../utils/logger.js'
import { objectsToCsvLines } from '../utils/csv.js'
import { streamTablePdf } from '../utils/pdf.js'
import { streamExcel } from '../utils/xlsx.js'
import { Op } from 'sequelize'

const { Product, Category, Supplier } = models

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const sendError = (res, err, fallback = 'Internal server error') => {
  const status = err?.status || 500
  res.status(status).json({ message: err?.message || fallback })
}

const toFinite = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const capLimit = (v, def = 5000, hard = 50000) =>
  Math.max(1, Math.min(parseInt(v ?? process.env.CSV_MAX_ROWS ?? String(def), 10) || def, hard))

const buildWhereFromQuery = ({ search = '', categoryId, supplierId, minStock, maxStock }) => {
  const where = {}
  const s = String(search).trim()
  if (s) where.name = { [Op.iLike]: `%${s}%` }
  if (categoryId) where.categoryId = categoryId
  if (supplierId) where.supplierId = supplierId

  const gte = toFinite(minStock)
  const lte = toFinite(maxStock)
  if (gte !== undefined || lte !== undefined) {
    where.stock = {}
    if (gte !== undefined) where.stock[Op.gte] = gte
    if (lte !== undefined) where.stock[Op.lte] = lte
  }
  return where
}

// Columnas para CSV/XLSX (completas)
const exportColumnsFull = [
  { key: 'id', header: 'ID', width: 36 },
  { key: 'name', header: 'Nombre', width: 32 },
  { key: 'description', header: 'Descripción', width: 50 },
  {
    key: 'price',
    header: 'Precio',
    width: 14,
    map: r => (r.price == null ? '' : Number(r.price)),
    excel: { cast: 'currency', alignment: { horizontal: 'right' } }
  },
  {
    key: 'stock',
    header: 'Stock',
    width: 12,
    map: r => (r.stock == null ? '' : Number(r.stock)),
    excel: { cast: 'number', alignment: { horizontal: 'right' } }
  },
  { key: 'category', header: 'Categoría', width: 22, map: r => r?.category?.name ?? '' },
  { key: 'supplier', header: 'Proveedor', width: 24, map: r => r?.supplier?.name ?? '' },
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

// Columnas compactas para PDF (A4 landscape)
const exportColumnsCompact = [
  { key: 'name', header: 'Name', width: 220 },
  { key: 'category', header: 'Category', width: 120, map: r => r?.category?.name ?? '' },
  { key: 'supplier', header: 'Supplier', width: 140, map: r => r?.supplier?.name ?? '' },
  { key: 'price', header: 'Price', width: 80, map: r => (r.price == null ? '' : Number(r.price)), align: 'right' },
  { key: 'stock', header: 'Stock', width: 60, align: 'right' }
]

const fetchExportRows = async (where, limit) => {
  return await Product.findAll({
    where,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'], required: false }
    ],
    order: [['created_at', 'DESC']],
    attributes: ['id', 'name', 'description', 'price', 'stock', 'created_at', 'updated_at'],
    limit,
    raw: true,
    nest: true
  })
}

const setNoStoreDownloadHeaders = (res, filename, mime) => {
  res.setHeader('Content-Type', `${mime}; charset=utf-8`)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  // Evita caching intermedio
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

// ──────────────────────────────────────────────────────────────────────────────
// CRUD JSON
// ──────────────────────────────────────────────────────────────────────────────
export const createProduct = async (req, res) => {
  const log = withReq(req)
  try {
    const newProduct = await createProductService(req.body)
    log.info('[AUDIT] product.created', {
      userId: req.user?.id,
      productId: newProduct.id,
      productName: newProduct.name
    })
    res.status(201).json({ message: 'Product created successfully.', productId: newProduct.id })
  } catch (err) {
    sendError(res, err, 'An error occurred while creating the product.')
  }
}

export const products = async (req, res) => {
  try {
    const data = await listProductsService(req.query)
    res.json(data)
  } catch (err) {
    sendError(res, err, 'An error occurred while fetching the products.')
  }
}

export const productById = async (req, res) => {
  try {
    const product = await getProductByIdService(req.params.id)
    res.json(product)
  } catch (err) {
    sendError(res, err, 'An error occurred while searching for the product.')
  }
}

export const updateProduct = async (req, res) => {
  const log = withReq(req)
  try {
    const product = await updateProductService(req.params.id, req.body)
    log.info('[AUDIT] product.updated', {
      userId: req.user?.id,
      productId: product.id,
      productName: product.name
    })
    res.json({ message: 'Product updated successfully.', product })
  } catch (err) {
    sendError(res, err, 'An error occurred while updating the product.')
  }
}

export const deleteProduct = async (req, res) => {
  const log = withReq(req)
  try {
    const result = await deleteProductService(req.params.id)
    log.info('[AUDIT] product.deleted', {
      userId: req.user?.id,
      productId: result?.product?.id,
      productName: result?.product?.name
    })
    res.json(result)
  } catch (err) {
    sendError(res, err, 'Error deleting product.')
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Export CSV (admin) — GET /api/products/export.csv
// ──────────────────────────────────────────────────────────────────────────────
export const exportProductsCSV = async (req, res) => {
  try {
    const where = buildWhereFromQuery(req.query)
    const MAX = capLimit(req.query.limit)

    const filename = `products_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
    setNoStoreDownloadHeaders(res, filename, 'text/csv')
    res.write('\uFEFF') // BOM
    res.write(objectsToCsvLines([], exportColumnsFull)[0] + '\n') // header

    // stream por lotes
    const batch = 1000
    let fetched = 0
    let offset = 0

    while (fetched < MAX) {
      const toFetch = Math.min(batch, MAX - fetched)
      const rows = await Product.findAll({
        where,
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
          { model: Supplier, as: 'supplier', attributes: ['id', 'name'], required: false }
        ],
        order: [['created_at', 'DESC']],
        attributes: ['id', 'name', 'description', 'price', 'stock', 'created_at', 'updated_at'],
        limit: toFetch,
        offset,
        raw: true,
        nest: true
      })

      if (!rows.length) break

      const lines = objectsToCsvLines(rows, exportColumnsFull)
      for (let i = 1; i < lines.length; i++) res.write(lines[i] + '\n')

      fetched += rows.length
      offset += rows.length
      if (rows.length < toFetch) break
    }

    res.end()
  } catch (err) {
    sendError(res, err, 'Error exporting products CSV.')
  }
}

// ──────────────────────────────────────────────────────────────────────────────
/** Export PDF (admin) — GET /api/products/export.pdf */
// ──────────────────────────────────────────────────────────────────────────────
export const exportProductsPDF = async (req, res) => {
  try {
    const where = buildWhereFromQuery(req.query)
    const MAX = capLimit(req.query.limit)
    const rows = await fetchExportRows(where, MAX)

    // Nota: streamTablePdf maneja los headers; por consistencia añadimos no-store
    const filename = `products_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`
    setNoStoreDownloadHeaders(res, filename, 'application/pdf')

    // layout landscape + ajustes para evitar overflow horizontal
    await streamTablePdf(res, rows, {
      title: 'Products',
      filename, // para Content-Disposition
      columns: exportColumnsCompact,
      layout: 'landscape',
      margin: 36,
      fontSize: 9
      // si tu util soporta estas opciones, puedes ajustar:
      // rowHeight: 18,
      // columnGap: 6,
      // headerFillColor: '#F3F4F6',
      // zebra: true,
    })
  } catch (err) {
    sendError(res, err, 'Error exporting products PDF.')
  }
}

// ──────────────────────────────────────────────────────────────────────────────
/** Export XLSX (admin) — GET /api/products/export.xlsx */
// ──────────────────────────────────────────────────────────────────────────────
export const exportProductsXLSX = async (req, res) => {
  try {
    const where = buildWhereFromQuery(req.query)
    const MAX = capLimit(req.query.limit)
    const rows = await fetchExportRows(where, MAX)

    const filename = `products_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`
    // streamExcel ya suele setear content-type/disposition; reforzamos no-store:
    setNoStoreDownloadHeaders(res, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    await streamExcel(res, rows, {
      filename,
      sheetName: 'Products',
      columns: exportColumnsFull
      // Si tu util soporta autoFilter/autoWidth:
      // autoFilter: true,
      // freezeHeader: true,
    })
  } catch (err) {
    sendError(res, err, 'Error exporting products XLSX.')
  }
}
