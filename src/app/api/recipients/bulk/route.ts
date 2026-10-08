import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

// Bulk create recipients
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const body = await req.json().catch(() => ({}))
  const { recipients } = body ?? {}
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return jsonError('NO_RECIPIENTS', 'Provide a non-empty recipients array.', 400)
  }
  if (recipients.length > 2000) {
    return jsonError('TOO_MANY', 'Maximum 2000 recipients per bulk request.', 400)
  }
  const data = recipients
    .filter((r: any) => r && r.name && String(r.name).trim())
    .map((r: any) => ({
      name: String(r.name).trim(),
      email: r.email ?? null,
      phone: r.phone ?? null,
      registrationId: r.registrationId ?? null,
      department: r.department ?? null,
      institution: r.institution ?? null,
      event: r.event ?? null,
      role: r.role ?? null,
      customField1: r.customField1 ?? null,
      customField2: r.customField2 ?? null,
      userId: user.id,
    }))
  if (data.length === 0) {
    return jsonError('NO_VALID', 'No valid recipients found (all missing name).', 400)
  }
  const result = await db.recipient.createMany({ data, skipDuplicates: false })
  return jsonOk({ created: result.count })
}

// Bulk delete recipients
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const body = await req.json().catch(() => ({}))
  const { ids } = body ?? {}
  if (!Array.isArray(ids) || ids.length === 0) {
    return jsonError('NO_IDS', 'Provide a non-empty ids array.', 400)
  }
  const result = await db.recipient.deleteMany({ where: { id: { in: ids }, userId: user.id } })
  return jsonOk({ deleted: result.count })
}
