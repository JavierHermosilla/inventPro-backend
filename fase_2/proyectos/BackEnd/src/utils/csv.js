// src/utils/csv.js
/**
 * Escapa un valor para CSV (RFC4180-like).
 * - Envuelve con comillas si hay coma, comillas o salto de línea.
 * - Duplica comillas internas.
 * - Convierte null/undefined a cadena vacía.
 */
export function csvEscape (val) {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/**
 * Convierte un arreglo de objetos en líneas CSV según un mapping de columnas.
 * @param {Array<object>} rows
 * @param {Array<{key:string, header:string, map?:(row)=>any}>} columns
 * @returns {string[]} líneas CSV (sin salto final)
 */
export function objectsToCsvLines (rows, columns, options = {}) {
  const {
    separator = ',',
    sanitizeNewlines = true
  } = options

  const header = columns.map(c => csvEscape(c.header))
  const lines = [header.join(separator)]

  for (const row of rows) {
    const vals = columns.map(c => {
      const raw = typeof c.map === 'function' ? c.map(row) : row[c.key]
      const normalized = sanitizeNewlines && typeof raw === 'string'
        ? raw.replace(/[\r\n]+/g, ' ').trim()
        : raw
      return csvEscape(normalized)
    })
    lines.push(vals.join(separator))
  }
  return lines
}

/**
 * Escribe CSV en el response de Express de forma incremental (streaming “simple”).
 * Incluye BOM UTF-8 para compatibilidad con Excel.
 * @param {import('express').Response} res
 * @param {Iterable<string>} lineIterator
 * @param {string} filename
 */
export async function streamCsv (res, lineIterator, filename = 'export.csv') {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  // BOM para Excel
  res.write('\uFEFF')

  for (const line of lineIterator) {
    res.write(line + '\n')
  }
  res.end()
}
