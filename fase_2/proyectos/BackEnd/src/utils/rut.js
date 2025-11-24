export const normalizeRut = (rut) =>
  rut?.replace(/\./g, '')
    .replace(/\s+/g, '')
    .toUpperCase() || ''

export const isValidRut = (rut) => {
  const r = normalizeRut(rut)
  if (!/^\d{1,8}-[\dK]$/i.test(r)) return false
  const [num, dv] = r.split('-')

  let sum = 0
  let mul = 2

  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i], 10) * mul
    mul = mul === 7 ? 2 : mul + 1
  }

  const res = 11 - (sum % 11)
  const dvCalc = res === 11 ? '0' : res === 10 ? 'K' : String(res)
  return dvCalc === dv.toUpperCase()
}
