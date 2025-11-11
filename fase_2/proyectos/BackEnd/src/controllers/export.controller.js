// src/controllers/export.controller.js
import PDFDocument from 'pdfkit'
import { format as formatDate } from 'date-fns'
import { es } from 'date-fns/locale'
import ExcelJS from 'exceljs'
import archiver from 'archiver'
import { models } from '../models/index.js'

const { Product, Category, Supplier, Client, Order, OrderProduct } = models

// -------------------- util de formato --------------------
const peso = (n) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Number(n || 0))

const num = (n) => new Intl.NumberFormat('es-CL').format(Number(n || 0))
const short = (s, n = 10) => String(s || '').slice(0, n)
const safeStr = (s) => (s ?? '').toString()
const cmp = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })
const get = (o, p, d = '') => p.split('.').reduce((x, k) => (x?.[k] ?? d), o)
const iso = (d) => (d ? new Date(d).toISOString() : '')
const asDate = (d) => (d ? new Date(d) : null)

// -------------------- órdenes de salida (bonitas) --------------------
const sortProducts = (arr) =>
  arr.slice().sort((a, b) => {
    const ac = safeStr(a.category?.name)
    const bc = safeStr(b.category?.name)
    if (ac !== bc) return cmp(ac, bc)
    const as = safeStr(a.supplier?.name)
    const bs = safeStr(b.supplier?.name)
    if (as !== bs) return cmp(as, bs)
    return cmp(safeStr(a.name), safeStr(b.name))
  })

const sortSuppliers = (arr) => arr.slice().sort((a, b) => cmp(safeStr(a.name), safeStr(b.name)))
const sortClients = (arr) => arr.slice().sort((a, b) => cmp(safeStr(a.name), safeStr(b.name)))
const sortOrders = (arr) =>
  arr.slice().sort((a, b) => new Date(b.created_at ?? b.createdAt) - new Date(a.created_at ?? a.createdAt))

// -------------------- helpers PDF (simetría y overflow seguro) --------------------
const MARGIN_L = 50
const MARGIN_R = 545
const CONTENT_W = MARGIN_R - MARGIN_L // 495 pt útiles
const ROW_H = 16

function maxY (doc) {
  return doc.page.height - doc.page.margins.bottom - 22
}

// ajusta el texto a una celda sin salto de línea (agrega “…” si no cabe)
function fit (doc, text, width, { pad = 12, font = 'Helvetica', size = 10 } = {}) {
  const s0 = String(text ?? '')
  doc.font(font).fontSize(size)
  const maxW = width - pad
  if (doc.widthOfString(s0) <= maxW) return s0
  let s = s0
  while (s.length && doc.widthOfString(s + '…') > maxW) s = s.slice(0, -1)
  return s + '…'
}

function header (doc, title) {
  doc.font('Helvetica').fillColor('black')
  doc.fontSize(20).text('InventPro — ' + title, MARGIN_L, undefined, { width: CONTENT_W, align: 'left' })
  doc.moveDown(0.3)
  doc.fontSize(10).fillColor('#666')
    .text('Generado: ' + formatDate(new Date(), "dd-LL-yyyy, HH:mm:ss 'hrs'", { locale: es }))
  doc.fillColor('black')
  doc.moveDown(0.8)
  doc.strokeColor('#ddd').lineWidth(1).moveTo(MARGIN_L, doc.y).lineTo(MARGIN_R, doc.y).stroke()
  doc.moveDown()
}

function footer (doc) {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i)
    const y = doc.page.height - doc.page.margins.bottom + 4
    doc.fontSize(9).fillColor('#666')
      .text(`Página ${i + 1} de ${range.count}`, MARGIN_L, y, { width: CONTENT_W, align: 'center' })
    doc.fillColor('black')
  }
}

function ensurePage (doc, rowsNeeded = 1) {
  const need = rowsNeeded * ROW_H + 40
  if (doc.y + need > maxY(doc)) doc.addPage()
}

function ensureRowSpace (doc, height) {
  const need = height + 24
  if (doc.y + need > maxY(doc)) doc.addPage()
}

function tableHeaderFixed (doc, cols) {
  const y0 = doc.y
  let x = MARGIN_L
  doc.save().rect(MARGIN_L, y0 - 2, CONTENT_W, ROW_H + 4).fill('#f5f5f5').restore()
  doc.font('Helvetica-Bold').fillColor('#111').fontSize(10)
  for (const c of cols) {
    doc.text(c.header, x + 6, y0 + 2, { width: c.width - 12, align: c.align || 'left' })
    doc.y = y0
    x += c.width
  }
  const lineY = y0 + ROW_H
  doc.strokeColor('#ddd').lineWidth(1).moveTo(MARGIN_L, lineY).lineTo(MARGIN_R, lineY).stroke()
  doc.font('Helvetica').fillColor('black')
  doc.y = lineY + 2
}

function tableRowFixed (doc, cols, values, options = {}) {
  const { bg, color, bold } = options
  const fontName = bold ? 'Helvetica-Bold' : 'Helvetica'
  doc.font(fontName).fontSize(10)

  const cells = cols.map((c, i) => {
    const text = values[i] == null ? '' : String(values[i])
    const align = c.align || (typeof values[i] === 'number' ? 'right' : 'left')
    const width = c.width - 12
    const height = Math.max(doc.heightOfString(text, { width, align }), ROW_H - 4)
    return { text, align, width, colWidth: c.width, height }
  })

  const rowHeight = Math.max(ROW_H, Math.ceil(Math.max(...cells.map(c => c.height)) + 4))
  ensureRowSpace(doc, rowHeight)

  const y = doc.y
  let x = MARGIN_L
  if (bg) { doc.save(); doc.rect(MARGIN_L, y - 1, CONTENT_W, rowHeight + 2).fill(bg).restore() }
  if (color) doc.fillColor(color)

  for (const cell of cells) {
    doc.text(cell.text, x + 6, y + 2, {
      width: cell.width,
      align: cell.align
    })
    x += cell.colWidth
  }

  doc.strokeColor('#eee').lineWidth(0.5).moveTo(MARGIN_L, y + rowHeight).lineTo(MARGIN_R, y + rowHeight).stroke()
  doc.fillColor('black')
  if (bold) doc.font('Helvetica')
  doc.y = y + rowHeight
}

function withReflowedHeader (doc, cols, draw) {
  const start = doc.page
  draw()
  if (doc.page !== start) tableHeaderFixed(doc, cols)
}

function kvGridPanel (doc, entriesLeft, entriesRight) {
  const cards = [...entriesLeft, ...entriesRight].map(([label, value]) => ({ label, value }))
  const cardsPerRow = 3
  const gap = 14
  const cardWidth = (CONTENT_W - gap * (cardsPerRow - 1)) / cardsPerRow
  const cardHeight = 70

  doc.font('Helvetica-Bold').fontSize(14).text('Resumen', MARGIN_L)
  doc.moveDown(0.4)

  let idx = 0
  while (idx < cards.length) {
    ensureRowSpace(doc, cardHeight)
    for (let col = 0; col < cardsPerRow && idx < cards.length; col++, idx++) {
      const card = cards[idx]
      const x = MARGIN_L + col * (cardWidth + gap)
      const y = doc.y
      doc.save()
        .roundedRect(x, y, cardWidth, cardHeight, 9)
        .fill('#fbfdff')
        .strokeColor('#dae4ff')
        .lineWidth(1)
        .stroke()
        .restore()

      doc.font('Helvetica').fontSize(9).fillColor('#5f6368')
        .text(card.label.toUpperCase(), x + 12, y + 10, { width: cardWidth - 24 })
      doc.font('Helvetica-Bold').fontSize(18).fillColor(BRAND_PRIMARY)
        .text(card.value, x + 12, y + 28, { width: cardWidth - 24 })
    }
    doc.y += cardHeight + 12
  }
  doc.fillColor('black')
  doc.moveDown(0.3)
}

// -------------------- datasets --------------------
async function loadDatasets () {
  const [products, suppliers, clients] = await Promise.all([
    Product.findAll({
      attributes: ['id', 'name', 'description', 'price', 'stock', 'created_at', 'updated_at'],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] }
      ]
    }),
    Supplier.findAll({ attributes: ['name', 'rut', 'phone', 'email'] }),
    Client.findAll({ attributes: ['name', 'rut', 'phone', 'email', 'address'] })
  ])

  const orders = await Order.findAll({
    attributes: ['id', 'status', 'isBackorder', 'totalAmount', 'created_at', 'updated_at', 'clientId'],
    include: [
      { model: Client, as: 'client', attributes: ['rut', 'name'] },
      {
        model: OrderProduct,
        as: 'items',
        attributes: ['id', 'orderId', 'productId', 'quantity', 'price', 'created_at'],
        include: [{ model: Product, as: 'product', attributes: ['name'] }]
      }
    ]
  })

  const P = sortProducts(products)
  const S = sortSuppliers(suppliers)
  const C = sortClients(clients)
  const O = sortOrders(orders)

  const inventoryUnits = P.reduce((a, p) => a + Number(p.stock || 0), 0)
  const inventoryValue = P.reduce((a, p) => a + Number(p.price || 0) * Number(p.stock || 0), 0)
  const totalOrders = O.length

  return { products: P, suppliers: S, clients: C, orders: O, inventoryUnits, inventoryValue, totalOrders }
}

// -------------------- endpoints --------------------
export const ping = (_req, res) => res.json({ ok: true })

// -------------------- PDF --------------------
export async function exportFullInventoryPDF (req, res) {
  try {
    const {
      products, suppliers, clients, orders,
      inventoryUnits, inventoryValue, totalOrders
    } = await loadDatasets()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="full_inventory_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf"`
    )

    const doc = new PDFDocument({ size: 'LETTER', margin: 50, bufferPages: true })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => {
      if (!res.headersSent) {
        res.send(Buffer.concat(chunks))
      }
    })
    doc.on('error', (err) => {
      console.error('[pdf] stream error:', err)
      if (!res.headersSent) res.status(500).json({ message: 'Error generando PDF' })
    })

    header(doc, 'Reporte General')

    // Panel Resumen
    kvGridPanel(
      doc,
      [
        ['Productos', num(products.length)],
        ['Proveedores', num(suppliers.length)],
        ['Clientes', num(clients.length)]
      ],
      [
        ['Órdenes totales', num(totalOrders)],
        ['Unidades inventario', num(inventoryUnits)],
        ['Inventario valorizado', peso(inventoryValue)]
      ]
    )
    doc.moveDown(0.6)

    // ---------- Productos ----------
    doc.font('Helvetica-Bold').fontSize(14).text('Inventario (Productos)', MARGIN_L)
    doc.moveDown(0.3)
    const COLS_PROD = [
      { header: 'ID', width: 65, align: 'left' },
      { header: 'Nombre', width: 150, align: 'left' },
      { header: 'Categoría', width: 90, align: 'left' },
      { header: 'Proveedor', width: 110, align: 'left' },
      { header: 'Precio', width: 50, align: 'right' },
      { header: 'Stock', width: 30, align: 'right' }
    ]
    tableHeaderFixed(doc, COLS_PROD)
    let zebra = false
    for (const p of products) {
      const st = Number(p.stock || 0)
      const color = st < 0 ? '#b00020' : (st === 0 ? '#ad6800' : undefined)
      zebra = !zebra
      withReflowedHeader(doc, COLS_PROD, () => {
        tableRowFixed(
          doc,
          COLS_PROD,
          [short(p.id, 12), p.name || '', p.category?.name || '', p.supplier?.name || '', peso(p.price || 0), num(st)],
          { bg: zebra ? '#fcfcfc' : null, color }
        )
      })
    }

    // ---------- Proveedores ----------
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(14).text('Proveedores', MARGIN_L)
    doc.moveDown(0.3)
    const COLS_SUP = [
      { header: 'Nombre', width: 165, align: 'left' },
      { header: 'RUT', width: 80, align: 'left' },
      { header: 'Teléfono', width: 85, align: 'left' },
      { header: 'Email', width: 165, align: 'left' }
    ]
    tableHeaderFixed(doc, COLS_SUP)
    zebra = false
    for (const s of suppliers) {
      zebra = !zebra
      withReflowedHeader(doc, COLS_SUP, () => {
        tableRowFixed(
          doc, COLS_SUP,
          [s.name || '', s.rut || '', s.phone || '', s.email || ''],
          { bg: zebra ? '#fcfcfc' : null }
        )
      })
    }

    // ---------- Clientes ----------
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(14).text('Clientes', MARGIN_L)
    doc.moveDown(0.3)
    const COLS_CLI = [
      { header: 'Nombre', width: 150, align: 'left' },
      { header: 'RUT', width: 70, align: 'left' },
      { header: 'Teléfono', width: 85, align: 'left' },
      { header: 'Email', width: 130, align: 'left' },
      { header: 'Dirección', width: 60, align: 'left' }
    ]
    tableHeaderFixed(doc, COLS_CLI)
    zebra = false
    for (const c of clients) {
      zebra = !zebra
      withReflowedHeader(doc, COLS_CLI, () => {
        tableRowFixed(
          doc, COLS_CLI,
          [c.name || '', c.rut || '', c.phone || '', c.email || '', c.address || ''],
          { bg: zebra ? '#fcfcfc' : null }
        )
      })
    }

    // ---------- Órdenes ----------
    doc.addPage()
    doc.font('Helvetica-Bold').fontSize(14).text('Órdenes (últimas 10)', MARGIN_L)
    doc.moveDown(0.3)
    const COLS_ORD = [
      { header: 'ID', width: 95, align: 'left' },
      { header: 'Fecha', width: 95, align: 'left' },
      { header: 'Cliente', width: 135, align: 'left' },
      { header: 'Estado', width: 55, align: 'center' },
      { header: 'Backorder', width: 45, align: 'center' },
      { header: 'Ítems', width: 40, align: 'right' },
      { header: 'Total', width: 30, align: 'right' }
    ]
    tableHeaderFixed(doc, COLS_ORD)
    zebra = false
    for (const o of orders.slice(0, 10)) {
      const fecha = formatDate(o.created_at || o.createdAt || new Date(), 'dd-LL-yyyy HH:mm', { locale: es })
      const itemsCount = Array.isArray(o.items) ? o.items.length : 0
      const linea = [
        short(o.id, 14),
        fecha,
        (o.client?.name || o.client?.rut || ''),
        o.status || '',
        o.isBackorder ? 'Sí' : 'No',
        String(itemsCount),
        peso(o.totalAmount || 0)
      ]
      const isRejected = (o.status || '').toLowerCase() === 'rejected'
      const color = isRejected ? '#b00020' : undefined
      zebra = !zebra
      withReflowedHeader(doc, COLS_ORD, () => {
        tableRowFixed(doc, COLS_ORD, linea, { bg: zebra ? '#fcfcfc' : null, color, bold: isRejected })
        if (itemsCount) {
          ensurePage(doc)
          const names = o.items.map(it => `${it.quantity}× ${get(it, 'product.name', 'Producto')}`).join(', ')
          const indent = COLS_ORD[0].width + COLS_ORD[1].width
          doc.fontSize(9).fillColor('#555')
            .text('• ' + fit(doc, names, CONTENT_W - indent), MARGIN_L + indent, doc.y - ROW_H + 3, { width: CONTENT_W - indent })
          doc.fillColor('black').fontSize(10)
        }
      })
    }

    footer(doc)
    doc.end()
  } catch (err) {
    res.status(err?.status || 500).json({ message: err?.message || 'Error generando PDF' })
  }
}

// -------------------- CSV (PLANO por defecto) --------------------
const BOM = '\uFEFF'
const csvEscape = (v) => {
  if (v === null || v === undefined) return ''
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function toCSV (rows, sep = ',') {
  if (!rows.length) return BOM
  const headers = Object.keys(rows[0])
  const lines = [BOM + headers.join(sep)]
  for (const r of rows) lines.push(headers.map(h => csvEscape(r[h])).join(sep))
  // CRLF para compatibilidad con Excel
  return lines.join('\r\n')
}

export async function exportFullInventoryCSV (req, res) {
  try {
    const { products, suppliers, clients, orders } = await loadDatasets()
    const mode = String(req.query.mode || 'merged').toLowerCase() // ← CSV plano por defecto
    const sep = String(req.query.sep || ',')

    const productsRows = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || '',
      supplier: p.supplier?.name || '',
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      created_at: iso(p.created_at),
      updated_at: iso(p.updated_at)
    }))
    const suppliersRows = suppliers.map(s => ({
      name: s.name, rut: s.rut || '', phone: s.phone || '', email: s.email || ''
    }))
    const clientsRows = clients.map(c => ({
      name: c.name, rut: c.rut || '', phone: c.phone || '', email: c.email || '', address: c.address || ''
    }))
    const ordersRows = orders.map(o => ({
      id: o.id,
      client_name: o.client?.name || '',
      client_rut: o.client?.rut || '',
      status: o.status || '',
      isBackorder: !!o.isBackorder,
      totalAmount: Number(o.totalAmount || 0),
      created_at: iso(o.created_at),
      updated_at: iso(o.updated_at)
    }))
    const itemsRows = orders.flatMap(o =>
      (o.items || []).map(it => ({
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        productName: it.product?.name || '',
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        created_at: iso(it.created_at)
      }))
    )

    // ===== CSV PLANO (merged) =====
    if (mode === 'merged') {
      const merged = []
      for (const r of productsRows) merged.push({ section: 'product', ...r })
      for (const r of suppliersRows) merged.push({ section: 'supplier', ...r })
      for (const r of clientsRows) merged.push({ section: 'client', ...r })
      for (const r of ordersRows) merged.push({ section: 'order', ...r })
      for (const r of itemsRows) merged.push({ section: 'item', ...r })

      const csv = toCSV(merged, sep)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="full_inventory_${new Date().toISOString().replace(/[:.]/g, '-')}.csv"`
      )
      return res.send(csv)
    }

    // ===== ZIP (varios CSV) =====
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="full_inventory_${new Date().toISOString().replace(/[:.]/g, '-')}.zip"`
    )

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', (err) => { throw err })
    archive.pipe(res)

    archive.append(toCSV(productsRows, sep), { name: 'productos.csv' })
    archive.append(toCSV(suppliersRows, sep), { name: 'proveedores.csv' })
    archive.append(toCSV(clientsRows, sep), { name: 'clientes.csv' })
    archive.append(toCSV(ordersRows, sep), { name: 'ordenes.csv' })
    archive.append(toCSV(itemsRows, sep), { name: 'items.csv' })

    await archive.finalize()
  } catch (err) {
    res.status(err?.status || 500).json({ message: err?.message || 'Error generando CSV' })
  }
}

// -------------------- XLSX --------------------
export async function exportFullInventoryXLSX (req, res) {
  try {
    const {
      products, suppliers, clients, orders,
      inventoryUnits, inventoryValue, totalOrders
    } = await loadDatasets()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="full_inventory_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx"`
    )

    const wb = new ExcelJS.Workbook()
    wb.creator = 'InventPro'
    wb.created = new Date()

    const styleHeader = (ws) => {
      const hdr = ws.getRow(1)
      hdr.font = { bold: true }
      hdr.alignment = { vertical: 'middle', horizontal: 'center' }
      hdr.height = 20
      hdr.eachCell((c) => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
        c.border = {
          top: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          left: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          right: { style: 'thin', color: { argb: 'FFE2E2E2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E2E2' } }
        }
      })
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }
      ws.views = [{ state: 'frozen', ySplit: 1 }]
    }

    const zebra = (ws) => {
      ws.eachRow((row, idx) => {
        if (idx === 1) return
        if (idx % 2 === 0) row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCFCFC' } } })
      })
    }

    // Resumen
    const wsR = wb.addWorksheet('Resumen')
    wsR.columns = [{ header: 'Métrica', key: 'k', width: 30 }, { header: 'Valor', key: 'v', width: 24 }]
    wsR.addRows([
      { k: 'Productos', v: products.length },
      { k: 'Proveedores', v: suppliers.length },
      { k: 'Clientes', v: clients.length },
      { k: 'Órdenes totales', v: totalOrders },
      { k: 'Unidades inventario', v: inventoryUnits },
      { k: 'Inventario valorizado', v: inventoryValue }
    ])
    styleHeader(wsR)
    wsR.getColumn('v').numFmt = '#,##0'
    wsR.getCell('B6').numFmt = '$ #,##0'

    // Productos
    const wsP = wb.addWorksheet('Productos')
    wsP.columns = [
      { header: 'ID', key: 'id', width: 38 },
      { header: 'Nombre', key: 'name', width: 32 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Proveedor', key: 'supplier', width: 24 },
      { header: 'Precio', key: 'price', width: 14 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Creado', key: 'created_at', width: 20 },
      { header: 'Actualizado', key: 'updated_at', width: 20 }
    ]
    wsP.addRows(products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || '',
      supplier: p.supplier?.name || '',
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      created_at: asDate(p.created_at),
      updated_at: asDate(p.updated_at)
    })))
    styleHeader(wsP)
    wsP.getColumn('price').numFmt = '$ #,##0'
    wsP.getColumn('stock').numFmt = '#,##0'
    ;['created_at', 'updated_at'].forEach(k => wsP.getColumn(k).numFmt = 'yyyy-mm-dd hh:mm')
    // resaltar stock
    wsP.eachRow((row, idx) => {
      if (idx === 1) return
      const stockCell = row.getCell('stock')
      const v = Number(stockCell.value || 0)
      if (v < 0) stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } } // rojo
      else if (v === 0) stockCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE599' } } // ámbar
    })
    zebra(wsP)

    // Proveedores
    const wsS = wb.addWorksheet('Proveedores')
    wsS.columns = [
      { header: 'Nombre', key: 'name', width: 32 },
      { header: 'RUT', key: 'rut', width: 16 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 34 }
    ]
    wsS.addRows(suppliers.map(s => ({ name: s.name, rut: s.rut || '', phone: s.phone || '', email: s.email || '' })))
    styleHeader(wsS); zebra(wsS)

    // Clientes
    const wsC = wb.addWorksheet('Clientes')
    wsC.columns = [
      { header: 'Nombre', key: 'name', width: 32 },
      { header: 'RUT', key: 'rut', width: 16 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 34 },
      { header: 'Dirección', key: 'address', width: 36 }
    ]
    wsC.addRows(clients.map(c => ({
      name: c.name, rut: c.rut || '', phone: c.phone || '', email: c.email || '', address: c.address || ''
    })))
    styleHeader(wsC); zebra(wsC)

    // Órdenes
    const wsO = wb.addWorksheet('Órdenes')
    wsO.columns = [
      { header: 'ID', key: 'id', width: 32 },
      { header: 'Cliente', key: 'client_name', width: 28 },
      { header: 'RUT', key: 'client_rut', width: 16 },
      { header: 'Estado', key: 'status', width: 14 },
      { header: 'Backorder', key: 'isBackorder', width: 12 },
      { header: 'Total', key: 'totalAmount', width: 14 },
      { header: 'Creado', key: 'created_at', width: 20 },
      { header: 'Actualizado', key: 'updated_at', width: 20 }
    ]
    wsO.addRows(orders.map(o => ({
      id: o.id,
      client_name: o.client?.name || '',
      client_rut: o.client?.rut || '',
      status: o.status || '',
      isBackorder: o.isBackorder ? 'Sí' : 'No',
      totalAmount: Number(o.totalAmount || 0),
      created_at: asDate(o.created_at),
      updated_at: asDate(o.updated_at)
    })))
    styleHeader(wsO); zebra(wsO)
    wsO.getColumn('totalAmount').numFmt = '$ #,##0'
    ;['created_at', 'updated_at'].forEach(k => wsO.getColumn(k).numFmt = 'yyyy-mm-dd hh:mm')
    wsO.eachRow((row, idx) => {
      if (idx === 1) return
      const c = row.getCell('status')
      const v = safeStr(c.value).toLowerCase()
      if (v === 'completed') c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }
      else if (v === 'pending') c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
      else if (v === 'rejected') c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }
    })

    // Ítems
    const wsI = wb.addWorksheet('Items')
    wsI.columns = [
      { header: 'ID Ítem', key: 'id', width: 32 },
      { header: 'Orden', key: 'orderId', width: 32 },
      { header: 'Producto ID', key: 'productId', width: 32 },
      { header: 'Producto', key: 'productName', width: 28 },
      { header: 'Cantidad', key: 'quantity', width: 10 },
      { header: 'Precio Unit', key: 'price', width: 14 },
      { header: 'Creado', key: 'created_at', width: 20 }
    ]
    const itemsRows = orders.flatMap(o =>
      (o.items || []).map(it => ({
        id: it.id,
        orderId: it.orderId,
        productId: it.productId,
        productName: it.product?.name || '',
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
        created_at: asDate(it.created_at)
      }))
    )
    wsI.addRows(itemsRows)
    styleHeader(wsI); zebra(wsI)
    wsI.getColumn('quantity').numFmt = '#,##0'
    wsI.getColumn('price').numFmt = '$ #,##0'
    wsI.getColumn('created_at').numFmt = 'yyyy-mm-dd hh:mm'

    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    res.status(err?.status || 500).json({ message: err?.message || 'Error generando XLSX' })
  }
}

