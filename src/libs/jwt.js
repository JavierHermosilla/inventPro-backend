import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/config.js'

export function createAccessToken (payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: '1d'
      },
      (err, token) => {
        if (err) reject(err)
        resolve(token)
      }
    )
  })
}

export function verifyToken (token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) reject(err)
      else resolve(decoded)
    })
  })
}
