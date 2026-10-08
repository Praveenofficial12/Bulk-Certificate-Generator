import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const settings = await db.setting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  // Include notifications (unread first)
  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
    take: 10,
  })
  return jsonOk({ settings: map, notifications })
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const body = await req.json().catch(() => ({}))
  const { settings } = body ?? {}
  if (!settings || typeof settings !== 'object') {
    return jsonError('INVALID_BODY', 'Provide a settings object to update.', 400)
  }
  for (const [key, value] of Object.entries(settings)) {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value)
    await db.setting.upsert({
      where: { key },
      create: { key, value: strVal },
      update: { value: strVal },
    })
  }
  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'SETTINGS_CHANGED',
      resource: 'Settings',
      status: 'INFO',
    },
  })
  return jsonOk({ updated: true })
}
