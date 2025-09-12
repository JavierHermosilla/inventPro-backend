import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config.js'

function promisifyJWT (fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

export function createAccessToken (payload) {
  return promisifyJWT(jwt.sign, payload, JWT_SECRET, { expiresIn: '1d' })
}

export function verifyToken (token) {
  return promisifyJWT(jwt.verify, token, JWT_SECRET)
}
