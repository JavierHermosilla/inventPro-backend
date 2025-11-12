const defaults = {
  DB_NAME: 'inventpro_test',
  DB_USER: 'testuser',
  DB_PASSWORD: 'testpass',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_SCHEMA: 'public',
  JWT_SECRET: 'test_jwt_secret',
  REFRESH_TOKEN_SECRET: 'test_refresh_secret'
}

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value
}

process.env.NODE_ENV = 'test'
process.env.SKIP_LOCAL_DOTENV = '1'
