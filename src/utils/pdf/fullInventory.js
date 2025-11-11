// src/utils/pdf/fullInventory.js
import PDFDocument from 'pdfkit'

const colGap = 6
const pageMargins = { top: 48, bottom: 48, left: 48, right: 48 }

const fmtCLP = (n) => {
  const num = Number(n)
  if (!Number.isFinite(num)) return ''
  return num.toLocaleString('es-CL')
}
const safe = (v) => (v ?? '').toString()
const cut = (v, n = 20) => safe(v).length > n ? safe(v).slice(0, n - 1) + '…' : safe(v)

function ensureSpace (doc, needed = 24) {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + needed >= bottom) doc.addPage()
}

function drawTitle (doc, text) {
  ensureSpace(doc, 32)
  doc.moveDown(0.3)
  doc.fontSize(14).font('Helvetica-Bold').text(text)
  doc.moveDown(0.3)
}

function drawTable (doc, columns, rows, opts = {}) {
  const { rowHeight = 18, headerHeight = 20 } = opts
  if (!Array.isArray(rows) || rows.length === 0) {
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#666')
      .text('— Sin registros —')
    doc.fillColor('black')
    return
  }

  // calcular anchos relativos
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const totalFlex = columns.reduce((acc, c) => acc + (c.flex ?? 1), 0)
  const widths = columns.map(c => Math.floor((c.flex ?? 1) * usableWidth / totalFlex))

  // header
  ensureSpace(doc, headerHeight + 6)
  doc.fontSize(10).font('Helvetica-Bold')
  columns.forEach((c, i) => {
    const x = doc.x + widths.slice(0, i).reduce((a, b) => a + b, 0)
    doc.text(c.header, x + 2, doc.y, { width: widths[i] - colGap, continued: false })
  })
  doc.moveDown(0.2)
  const yLine = doc.y + 2
  doc.moveTo(doc.x, yLine).lineTo(doc.x + usableWidth, yLine).strokeColor('#aaa').lineWidth(0.5).stroke()
  doc.strokeColor('black')

  // rows
  doc.font('Helvetica').fontSize(10)
  for (const r of rows) {
    ensureSpace(doc, rowHeight)
    columns.forEach((c, i) => {
      const mapVal = c.map ? c.map(r) : r[c.key]
      const txt = (mapVal === null || mapVal === undefined) ? '' : String(mapVal)
      const x = doc.x + widths.slice(0, i).reduce((a, b) => a + b, 0)
      doc.text(txt, x + 2, doc.y + 4, { width: widths[i] - colGap })
    })
    doc.moveDown((rowHeight - 12) / 10) // ajustar separación
  }
}

export async function renderFullInventoryPDF (resStream, data) {
  const { products = [], suppliers = [], clients = [], meta = {} } = data

  const doc = new PDFDocument({
    size: 'A4',
    margins: pageMargins,
    autoFirstPage: true
  })
  doc.pipe(resStream)

  // portada / encabezado
  doc.font('Helvetica-Bold').fontSize(18).text('InventPro — Reporte General')
  doc.moveDown(0.5)
  doc.font('Helvetica').fontSize(10).fillColor('#555')
    .text(`Generado: ${(meta.generatedAt ?? new Date()).toLocaleString('es-CL')}`)
  doc.fillColor('black')
  doc.moveDown(0.8)

  // Resumen
  drawTitle(doc, 'Resumen')
  doc.fontSize(11).text(`Productos: ${products.length}`)
  doc.text(`Proveedores: ${suppliers.length}`)
  doc.text(`Clientes: ${clients.length}`)
  doc.moveDown(0.5)

  // Productos
  drawTitle(doc, 'Inventario (Productos)')
  drawTable(doc, [
    { key: 'id', header: 'ID', flex: 2, map: r => cut(r.id, 16) },
    { key: 'name', header: 'Nombre', flex: 4, map: r => cut(r.name, 28) },
    { key: 'category', header: 'Categoría', flex: 3, map: r => cut(r.category?.name ?? '', 18) },
    { key: 'supplier', header: 'Proveedor', flex: 3, map: r => cut(r.supplier?.name ?? '', 18) },
    { key: 'price', header: 'Precio', flex: 2, map: r => fmtCLP(r.price) },
    { key: 'stock', header: 'Stock', flex: 2, map: r => String(r.stock ?? '') }
  ], products)

  doc.moveDown(0.8)

  // Proveedores
  drawTitle(doc, 'Proveedores')
  drawTable(doc, [
    { key: 'id', header: 'ID', flex: 2, map: r => cut(r.id, 16) },
    { key: 'name', header: 'Nombre', flex: 4, map: r => cut(r.name, 28) },
    { key: 'rut', header: 'RUT', flex: 2, map: r => safe(r.rut) },
    { key: 'phone', header: 'Teléfono', flex: 2, map: r => safe(r.phone) },
    { key: 'email', header: 'Email', flex: 3, map: r => cut(r.email, 28) }
  ], suppliers)

  doc.moveDown(0.8)

  // Clientes
  drawTitle(doc, 'Clientes')
  drawTable(doc, [
    { key: 'id', header: 'ID', flex: 2, map: r => cut(r.id, 16) },
    { key: 'name', header: 'Nombre', flex: 4, map: r => cut(r.name, 28) },
    { key: 'rut', header: 'RUT', flex: 2, map: r => safe(r.rut) },
    { key: 'phone', header: 'Teléfono', flex: 2, map: r => safe(r.phone) },
    { key: 'email', header: 'Email', flex: 3, map: r => cut(r.email, 28) }
  ], clients)

  doc.end()
  // No await necesario; pdfkit finalizará el stream
}
