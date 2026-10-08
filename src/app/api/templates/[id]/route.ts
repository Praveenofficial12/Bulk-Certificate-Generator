import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const template = await db.template.findUnique({ where: { id } })
  if (!template) return jsonError('NOT_FOUND', 'Template not found.', 404)
  return jsonOk(template)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  if (user.role !== 'ADMIN') return jsonError('FORBIDDEN', 'Only admins can edit templates.', 403)
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { name, description, orientation, paperSize, accentColor, fontFamily, config, isDefault, status } = body ?? {}
  const updated = await db.template.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(orientation !== undefined ? { orientation } : {}),
      ...(paperSize !== undefined ? { paperSize } : {}),
      ...(accentColor !== undefined ? { accentColor } : {}),
      ...(fontFamily !== undefined ? { fontFamily } : {}),
      ...(config !== undefined ? { config } : {}),
      ...(isDefault !== undefined ? { isDefault } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  })
  return jsonOk(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  if (user.role !== 'ADMIN') return jsonError('FORBIDDEN', 'Only admins can delete templates.', 403)
  const { id } = await params
  await db.template.delete({ where: { id } })
  return jsonOk({ deleted: true })
}
