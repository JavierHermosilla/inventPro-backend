// Utilidades simples para exportar tablas a PDF y XLSX
// src/utils/tableExport.js
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'

// rowsAOA: Array of Arrays (primera fila = headers)
export function writePdfFromAOA (res, { title, rowsAOA, filename = 'export.pdf' }) {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 36 })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  doc.pipe(res)

  // Título
  doc.fontSize(14).text(title || 'Export', { align: 'left' })
  doc.moveDown(0.5)

  // “Tabla” simple (alineación por columnas separadas)
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const cols = rowsAOA[0]?.length || 0
  const colWidth = cols ? Math.floor(pageWidth / cols) : pageWidth

  const drawRow = (arr, isHeader = false) => {
    if (doc.y > doc.page.height - 72) doc.addPage()
    arr.forEach((cell, i) => {
      const x = doc.page.margins.left + i * colWidth
      doc.fontSize(isHeader ? 10 : 9)
      doc.text(String(cell ?? ''), x, doc.y, { width: colWidth, continued: false })
    })
    doc.moveDown(0.6)
    if (isHeader) doc.moveDown(0.2)
  }

  rowsAOA.forEach((r, idx) => drawRow(r, idx === 0))
  doc.end()
}

export function writeXlsxFromAOA (res, { sheetName = 'Sheet1', rowsAOA, filename = 'export.xlsx' }) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(rowsAOA)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(buf)
}
