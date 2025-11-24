function generarRUTconK () {
  for (let i = 1000000; i < 9999999; i++) {
    const body = i.toString()
    let sum = 0
    let multiplier = 2
    for (let j = body.length - 1; j >= 0; j--) {
      sum += parseInt(body[j]) * multiplier
      multiplier = multiplier < 7 ? multiplier + 1 : 2
    }
    const dvCalc = 11 - (sum % 11)
    const dv = dvCalc === 10 ? 'K' : dvCalc === 11 ? '0' : dvCalc.toString()
    if (dv === 'K') return `${body}-K`
  }
}

console.log('RUT válido con DV K:', generarRUTconK())
