import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const sp = req.nextUrl.searchParams
  const days = parseInt(sp.get('days') ?? '30') || 30
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)

  // daily certificates generated
  const certs = await db.certificate.findMany({
    where: { userId: user.id, generatedAt: { gte: start } },
    select: { generatedAt: true, status: true },
  })
  const dailyMap = new Map<string, { count: number; failed: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { count: 0, failed: 0 })
  }
  for (const c of certs) {
    const key = c.generatedAt.toISOString().slice(0, 10)
    const e = dailyMap.get(key) ?? { count: 0, failed: 0 }
    e.count++
    if (c.status === 'FAILED') e.failed++
    dailyMap.set(key, e)
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({ date, count: v.count, failed: v.failed }))

  // monthly
  const monthlyMap = new Map<string, number>()
  const allCerts = await db.certificate.findMany({
    where: { userId: user.id },
    select: { generatedAt: true },
  })
  for (const c of allCerts) {
    const key = c.generatedAt.toISOString().slice(0, 7)
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1)
  }
  const monthly = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)

  // job status distribution
  const jobs = await db.generationJob.findMany({
    where: { userId: user.id },
    select: { status: true },
  })
  const statusMap = new Map<string, number>()
  for (const j of jobs) {
    statusMap.set(j.status, (statusMap.get(j.status) ?? 0) + 1)
  }
  const jobStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }))

  // template usage
  const templates = await db.template.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { certificates: { where: { userId: user.id, status: 'GENERATED' } } } },
    },
  })
  const templateUsage = templates.map((t) => ({ templateId: t.id, name: t.name, count: t._count.certificates }))

  // top events
  const certsAll = await db.certificate.findMany({
    where: { userId: user.id, status: 'GENERATED' },
    select: { eventName: true },
  })
  const eventMap = new Map<string, number>()
  for (const c of certsAll) {
    eventMap.set(c.eventName, (eventMap.get(c.eventName) ?? 0) + 1)
  }
  const topEvents = Array.from(eventMap.entries())
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return jsonOk({ daily, monthly, jobStatus, templateUsage, topEvents })
}
