import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, parsePagination } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const sp = req.nextUrl.searchParams
  const search = sp.get('search') ?? ''
  const department = sp.get('department') ?? ''
  const status = sp.get('status') ?? ''
  const { page, pageSize } = parsePagination(req)

  const where: any = { userId: user.id }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { registrationId: { contains: search } },
      { department: { contains: search } },
    ]
  }
  if (department) where.department = department
  if (status) where.status = status

  const [total, items] = await Promise.all([
    db.recipient.count({ where }),
    db.recipient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return jsonOk({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  let body: any
  try { body = await req.json() } catch { return jsonError('INVALID_BODY', 'Invalid JSON.', 400) }
  const { name, email, phone, registrationId, department, institution, event, role, customField1, customField2 } = body ?? {}
  if (!name || !name.trim()) return jsonError('MISSING_FIELDS', 'Recipient name is required.', 400)
  const created = await db.recipient.create({
    data: {
      name: String(name).trim(),
      email: email ?? null,
      phone: phone ?? null,
      registrationId: registrationId ?? null,
      department: department ?? null,
      institution: institution ?? null,
      event: event ?? null,
      role: role ?? null,
      customField1: customField1 ?? null,
      customField2: customField2 ?? null,
      userId: user.id,
    },
  })
  await db.activityLog.create({
    data: { userId: user.id, userName: user.name, action: 'RECIPIENT_CREATED', resource: 'Recipient', resourceId: created.id, status: 'SUCCESS', ipAddress: 'unknown' },
  })
  return jsonOk(created, 201)
}
