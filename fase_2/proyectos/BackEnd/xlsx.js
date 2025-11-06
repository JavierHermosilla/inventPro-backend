// src/utils/xlsx.js
import ExcelJS from 'exceljs'

/**
 * Stream XLSX usando writer por streaming.
 * @param {import('express').Response} res
 * @param {AsyncIterable<object>|Iterable<object>|Array<object>} rows
 * @param {{ filename?: string, sheetName?: string, columns: Array<{key:string, header:string, map?:(r:any)=>any, width?:number}> }} opts
 */
export async function streamExcel (res, rows, opts) {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1',
    columns = []
  } = opts || {}

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: false, useSharedStrings: true })
  const ws = wb.addWorksheet(sheetName)

  ws.columns = columns.map(c => ({ header: c.header, key: c.key, width: c.width || 20 }))

  const pushRow = (r) => {
    const out = {}
    for (const c of columns) {
      out[c.key] = typeof c.map === 'function' ? c.map(r) : r[c.key]
    }
    ws.addRow(out).commit()
  }

  if (Symbol.asyncIterator in Object(rows)) {
    for await (const r of rows) pushRow(r)
  } else {
    for (const r of rows) pushRow(r)
  }

  await wb.commit() // cierra el stream
}
