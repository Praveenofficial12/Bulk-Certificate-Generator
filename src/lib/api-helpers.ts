import { NextRequest } from 'next/server'
import { db } from './db'
import { verifyToken } from './auth'
import { seedDatabase } from './seed'

export interface RequestContext {
  user?: {
    id: string
    email: string
    name: string
    role: 'ADMIN' | 'STAFF'
  } | null
}

let seedPromise: Promise<boolean> | null = null
export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedDatabase()
  }
  try {
    await seedPromise
  } catch (e) {
    console.error('Seed failed:', e)
    seedPromise = null
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<RequestContext['user']> {
  await ensureSeeded()
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const payload = verifyToken<{ userId: string; role: string }>(token)
  if (!payload) return null
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  })
  return user as RequestContext['user']
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return Response.json(
    { success: false, error: { code, message, details } },
    { status }
  )
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

// Lightweight pagination parser
export function parsePagination(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') ?? '1') || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get('pageSize') ?? '10') || 10))
  return { page, pageSize }
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
