import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonError } from '@/lib/api-helpers'
import fs from 'fs'
import path from 'path'

const TEMPLATE_DIR = path.join(process.cwd(), 'storage', 'templates')

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const template = await db.template.findUnique({ where: { id } })
  if (!template) return jsonError('NOT_FOUND', 'Template not found.', 404)
  if (!template.backgroundImage) return jsonError('NO_IMAGE', 'This template has no background image.', 404)

  const relPath = template.backgroundImage
  const absPath = relPath.startsWith('/')
    ? relPath
    : path.join(process.cwd(), relPath)
  if (!absPath.startsWith(TEMPLATE_DIR)) {
    return jsonError('INVALID_PATH', 'Invalid template image path.', 400)
  }
  if (!fs.existsSync(absPath)) {
    return jsonError('FILE_MISSING', 'The template image no longer exists on disk.', 410)
  }
  const ext = absPath.toLowerCase().split('.').pop()
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream'
  const buf = fs.readFileSync(absPath)
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
