import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const r = await db.recipient.findFirst({ where: { id, userId: user.id } })
  if (!r) return jsonError('NOT_FOUND', 'Recipient not found.', 404)
  return jsonOk(r)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { name, email, phone, registrationId, department, institution, event, role, customField1, customField2, status } = body ?? {}
  const updated = await db.recipient.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(registrationId !== undefined ? { registrationId: registrationId || null } : {}),
      ...(department !== undefined ? { department: department || null } : {}),
      ...(institution !== undefined ? { institution: institution || null } : {}),
      ...(event !== undefined ? { event: event || null } : {}),
      ...(role !== undefined ? { role: role || null } : {}),
      ...(customField1 !== undefined ? { customField1: customField1 || null } : {}),
      ...(customField2 !== undefined ? { customField2: customField2 || null } : {}),
      ...(status !== undefined ? { status } : {}),
    },
  })
  if (updated.count === 0) return jsonError('NOT_FOUND', 'Recipient not found.', 404)
  return jsonOk({ updated: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const deleted = await db.recipient.deleteMany({ where: { id, userId: user.id } })
  if (deleted.count === 0) return jsonError('NOT_FOUND', 'Recipient not found.', 404)
  return jsonOk({ deleted: true })
}
