import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production-bcg-2026'
const JWT_EXPIRES_IN = '7d'

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10)
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash)
}

export function signToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken<T = { userId: string; role: string }>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T
  } catch {
    return null
  }
}

export function generateId(prefix: string, seq: number, padding = 4): string {
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(seq).padStart(padding, '0')}`
}

export function generateJobId(seq: number): string {
  const year = new Date().getFullYear()
  return `JOB-${year}-${String(seq).padStart(5, '0')}`
}

export function generateVerificationToken(): string {
  return Array.from({ length: 32 }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('')
}
