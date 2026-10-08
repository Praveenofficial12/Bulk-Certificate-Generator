import { NextRequest } from 'next/server'
import { ensureSeeded, jsonOk } from '@/lib/api-helpers'

export async function POST() {
  await ensureSeeded()
  return jsonOk({ seeded: true })
}
