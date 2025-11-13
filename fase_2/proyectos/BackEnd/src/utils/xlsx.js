// src/utils/xlsx.js
import ExcelJS from 'exceljs'

const DEFAULT_HEADER_BG = 'FF1F2937'
const DEFAULT_HEADER_FONT = 'FFFFFFFF'
const ZEBRA_ROW_BG = 'FFF7F9FC'

const isAsyncIterable = (value) => Boolean(value && typeof value[Symbol.asyncIterator] === 'function')
const isIterable = (value) => Boolean(value && typeof value[Symbol.iterator] === 'function')

const toExcelDate = (value) => {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const toExcelNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * Stream XLSX con estilos básicos (cabecera, zebra, formatos numéricos).
 * Column schema admite propiedades opcionales:
 *  - width: número
 *  - map: (row) => any
 *  - excel: { cast?: 'number'|'currency'|'date', numFmt?: string, alignment?: Excel.Alignment, value?: (row, raw) => any }
 */
export async function streamExcel (res, rows, opts) {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1',
    columns = [],
    freezeHeader = true,
    autoFilter = true,
    zebra = true,
    headerFill = DEFAULT_HEADER_BG,
    headerFontColor = DEFAULT_HEADER_FONT
  } = opts || {}

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true
  })

  const worksheetOpts = freezeHeader ? { views: [{ state: 'frozen', ySplit: 1 }] } : {}
  const ws = wb.addWorksheet(sheetName, worksheetOpts)

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 20
  }))

  if (autoFilter && columns.length > 0) {
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    }
  }

  // Header styling
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: headerFontColor } }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE0E6ED' } },
      left: { style: 'thin', color: { argb: 'FFE0E6ED' } },
      right: { style: 'thin', color: { argb: 'FFE0E6ED' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E6ED' } }
    }
  })
  headerRow.commit()

  const formatCellValue = (column, rawValue, record) => {
    const excelOpts = column.excel || {}
    if (typeof excelOpts.value === 'function') {
      return excelOpts.value(record, rawValue)
    }
    switch (excelOpts.cast) {
      case 'number':
        return toExcelNumber(rawValue)
      case 'currency':
        return toExcelNumber(rawValue)
      case 'date':
        return toExcelDate(rawValue)
      default:
        return rawValue
    }
  }

  let rowIndex = 2
  const writeRow = (record) => {
    const payload = {}
    columns.forEach((column) => {
      const baseValue = typeof column.map === 'function' ? column.map(record) : record[column.key]
      payload[column.key] = formatCellValue(column, baseValue, record)
    })

    const row = ws.addRow(payload)
    row.eachCell((cell, colNumber) => {
      const column = columns[colNumber - 1] || {}
      const excelOpts = column.excel || {}

      if (excelOpts.numFmt) {
        cell.numFmt = excelOpts.numFmt
      } else if (excelOpts.cast === 'currency') {
        cell.numFmt = '$ #,##0'
      } else if (excelOpts.cast === 'number') {
        cell.numFmt = '#,##0'
      } else if (excelOpts.cast === 'date') {
        cell.numFmt = 'yyyy-mm-dd hh:mm'
      }

      if (excelOpts.alignment) {
        cell.alignment = excelOpts.alignment
      } else if (typeof cell.value === 'number') {
        cell.alignment = { horizontal: 'right' }
      } else {
        cell.alignment = { horizontal: 'left' }
      }
    })

    if (zebra && rowIndex % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_ROW_BG } }
      })
    }

    row.commit()
    rowIndex++
  }

  if (isAsyncIterable(rows)) {
    for await (const record of rows) writeRow(record)
  } else if (isIterable(rows)) {
    for (const record of rows) writeRow(record)
  } else if (rows) {
    writeRow(rows)
  }

  await wb.commit()
}
