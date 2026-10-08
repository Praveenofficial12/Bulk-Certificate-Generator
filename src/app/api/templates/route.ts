import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const templates = await db.template.findMany({ orderBy: { createdAt: 'asc' } })
  return jsonOk(templates)
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  if (user.role !== 'ADMIN') return jsonError('FORBIDDEN', 'Only admins can create templates.', 403)
  let body: any
  try { body = await req.json() } catch { return jsonError('INVALID_BODY', 'Invalid JSON.', 400) }
  const { name, slug, description, orientation, paperSize, accentColor, fontFamily, config, isDefault } = body ?? {}
  if (!name || !slug) return jsonError('MISSING_FIELDS', 'Name and slug are required.', 400)
  const existing = await db.template.findUnique({ where: { slug } })
  if (existing) return jsonError('TEMPLATE_EXISTS', 'A template with this slug already exists.', 409)
  const created = await db.template.create({
    data: {
      name, slug, description: description ?? null,
      orientation: orientation ?? 'landscape',
      paperSize: paperSize ?? 'A4',
      accentColor: accentColor ?? '#1e3a8a',
      fontFamily: fontFamily ?? 'Helvetica',
      config: config ?? '{}',
      isDefault: !!isDefault,
      status: 'ACTIVE',
    },
  })
  return jsonOk(created, 201)
}
