// ejemplo mínimo para evitar fallo de suite vacía
describe('Dummy test suite', () => {
  test('should always pass', () => {
    expect(true).toBe(true)
  })
})
