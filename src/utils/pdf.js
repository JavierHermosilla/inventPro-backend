// src/utils/pdf.js
import PDFDocument from 'pdfkit'

/**
 * Intenta extender doc.table con 'pdfkit-table'.
 * Si no está instalada, seguimos con un renderer simple.
 */
let hasPdfTable = false
try {
  await import('pdfkit-table') // parchea PDFDocument para tener doc.table
  hasPdfTable = true
} catch {
  console.warn('[pdf] pdfkit-table no instalado; usando fallback simple.')
}

/** Dibuja una tabla básica (fallback) */
function drawSimpleTable (doc, rows, columns, { headerBg = '#efefef', x = 36, y = null, rowH = 18 } = {}) {
  const pageW = doc.page.width
  const pageH = doc.page.height
  const margins = doc.page.margins
  const usableW = pageW - margins.left - margins.right

  const startY = y ?? Math.max(doc.y || margins.top, margins.top + 40)

  // calcular anchos proporcionales si no vienen
  const widths = columns.map(c => Number(c.width) || 20)
  const total = widths.reduce((a, b) => a + b, 0)
  const px = widths.map(w => Math.max(50, Math.floor((w / total) * usableW))) // piso 50 px

  // header
  doc.save()
  doc.rect(margins.left, startY, usableW, rowH).fill(headerBg).fillColor('#000').fontSize(10)
  let cx = margins.left + 6
  columns.forEach((c, i) => {
    doc.text(String(c.header ?? c.key), cx, startY + 4, { width: px[i] - 12, ellipsis: true })
    cx += px[i]
  })
  doc.restore()

  let cy = startY + rowH

  // filas
  doc.fontSize(9).fillColor('#000')
  for (const r of rows) {
    // salto de página si es necesario
    if (cy + rowH > pageH - margins.bottom) {
      doc.addPage()
      // reimprimir header
      doc.save()
      doc.rect(margins.left, margins.top, usableW, rowH).fill(headerBg).fillColor('#000').fontSize(10)
      let hx = margins.left + 6
      columns.forEach((c, i) => {
        doc.text(String(c.header ?? c.key), hx, margins.top + 4, { width: px[i] - 12, ellipsis: true })
        hx += px[i]
      })
      doc.restore()
      cy = margins.top + rowH
    }

    let tx = margins.left + 6
    columns.forEach((c, i) => {
      const raw = typeof c.map === 'function' ? c.map(r) : r[c.key]
      const val = raw == null ? '' : String(raw)
      const opts = { width: px[i] - 12, ellipsis: true, align: c.align || (typeof raw === 'number' ? 'right' : 'left') }
      doc.text(val, tx, cy + 4, opts)
      tx += px[i]
    })
    cy += rowH
  }

  // coloca el cursor al final de la tabla
  doc.moveTo(margins.left, cy)
  doc.moveDown(0.5)
}

function hr (doc) {
  doc.strokeColor('#ddd').lineWidth(1).moveTo(36, doc.y).lineTo(doc.page.width - 36, doc.y).stroke()
}

function sectionTitle (doc, text) {
  doc.moveDown(0.5)
  doc.fontSize(14).fillColor('#000').text(text, { align: 'left' })
  hr(doc)
  doc.moveDown(0.3)
}

/**
 * Stream de UNA sola tabla.
 * Mantengo esta función por compatibilidad con tus exportadores actuales.
 */
export function streamTablePdf (res, rows, { title = 'Export', filename = 'export.pdf', columns = [] } = {}) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { left: 36, right: 36, top: 48, bottom: 48 }
  })

  doc.pipe(res)

  // Título
  doc.fontSize(16).text(title, { align: 'left' })
  doc.moveDown(0.5)
  hr(doc)
  doc.moveDown(0.5)

  if (hasPdfTable && typeof doc.table === 'function') {
    const headers = columns.map(c => c.header)
    const dataRows = rows.map(r => columns.map(c => (typeof c.map === 'function' ? c.map(r) : r[c.key])))
    const table = { headers, rows: dataRows }
    const tableOpts = {
      prepareHeader: () => doc.fontSize(10),
      prepareRow: () => doc.fontSize(9),
      columnSpacing: 6,
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right
    }
    // @ts-ignore
    doc.table(table, tableOpts)
  } else {
    drawSimpleTable(doc, rows, columns, { y: doc.y + 6 })
  }

  doc.end()
}

/**
 * Stream de PDF con MÚLTIPLES secciones (cada una con su título + tabla)
 * sections: [{ title, columns, rows }]
 */
export function streamSectionsPdf (res, sections, {
  filename = `full_inventory_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`,
  docTitle = 'InventPro — Reporte General',
  layout = 'landscape'
} = {}) {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const doc = new PDFDocument({
    size: 'A4',
    layout,
    margins: { left: 36, right: 36, top: 48, bottom: 48 }
  })
  doc.pipe(res)

  // Portada simple
  doc.fontSize(18).text(docTitle, { align: 'left' })
  doc.moveDown(0.2)
  doc.fontSize(10).fillColor('#555').text(`Generado: ${new Date().toLocaleString()}`)
  hr(doc)
  doc.moveDown(0.8)

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]
    if (!sec) continue
    if (i > 0) doc.addPage()

    sectionTitle(doc, sec.title || `Sección ${i + 1}`)

    const rows = Array.isArray(sec.rows) ? sec.rows : []
    const cols = Array.isArray(sec.columns) ? sec.columns : []

    if (hasPdfTable && typeof doc.table === 'function') {
      const headers = cols.map(c => c.header)
      const dataRows = rows.map(r => cols.map(c => (typeof c.map === 'function' ? c.map(r) : r[c.key])))
      const table = { headers, rows: dataRows }
      const tableOpts = {
        prepareHeader: () => doc.fontSize(10),
        prepareRow: () => doc.fontSize(9),
        columnSpacing: 6,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right
      }
      // @ts-ignore
      doc.table(table, tableOpts)
    } else {
      drawSimpleTable(doc, rows, cols, { y: doc.y + 6 })
    }
  }

  doc.end()
}
