import { verifyTokenMiddleware } from '../../middleware/auth.middleware.js' // desde src/test/middleware/ hacia src/middleware/
import { verifyToken } from '../../libs/jwt.js'
import User from '../../models/user.model.js'

jest.mock('../../libs/jwt.js')
jest.mock('../../models/user.model.js')
jest.mock('../../utils/logger.js', () => ({
  warn: jest.fn(),
  error: jest.fn()
}))

describe('verifyTokenMiddleware', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {},
      cookies: {}
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  test('should return 401 if no token', async () => {
    await verifyTokenMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided, authorization denied' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 if token invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken'
    verifyToken.mockRejectedValue(new Error('invalid token'))
    await verifyTokenMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 if decoded token missing id', async () => {
    req.headers.authorization = 'Bearer validtoken'
    verifyToken.mockResolvedValue({})
    await verifyTokenMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token payload' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 404 if user not found', async () => {
    req.headers.authorization = 'Bearer validtoken'
    verifyToken.mockResolvedValue({ id: '123' })
    User.findById.mockResolvedValue(null)
    await verifyTokenMiddleware(req, res, next)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' })
    expect(next).not.toHaveBeenCalled()
  })

  test('should call next if token and user valid', async () => {
    req.headers.authorization = 'Bearer validtoken'
    verifyToken.mockResolvedValue({ id: '123' })
    User.findById.mockResolvedValue({ _id: '123', role: 'admin' })
    await verifyTokenMiddleware(req, res, next)
    expect(req.user).toEqual({ id: '123', role: 'admin' })
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
