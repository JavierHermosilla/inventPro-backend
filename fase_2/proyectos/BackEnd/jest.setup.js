// src/test/jest.setup.js

import { setupTests, teardownTests, clearDatabase } from './src/test/setup.js'

beforeAll(async () => {
  await setupTests()
})

afterAll(async () => {
  await teardownTests()
})

afterEach(async () => {
  await clearDatabase()
})
