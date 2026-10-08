import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg'])
const MAX_SIZE = 8 * 1024 * 1024 // 8MB
const TEMPLATE_DIR = path.join(process.cwd(), 'storage', 'templates')

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const accentColor = (formData.get('accentColor') as string | null) || '#1e3a8a'
  const orientation = (formData.get('orientation') as string | null) || 'landscape'
  const paperSize = (formData.get('paperSize') as string | null) || 'A4'

  if (!file) return jsonError('NO_FILE', 'No image uploaded.', 400)
  if (!name || !name.trim()) return jsonError('MISSING_NAME', 'Template name is required.', 400)
  if (!ALLOWED_MIME.has(file.type)) {
    return jsonError('UNSUPPORTED_FILE_TYPE', 'Only PNG and JPG images are supported.', 400)
  }
  if (file.size > MAX_SIZE) {
    return jsonError('FILE_TOO_LARGE', 'Image exceeds the 8MB limit.', 413)
  }

  if (!fs.existsSync(TEMPLATE_DIR)) fs.mkdirSync(TEMPLATE_DIR, { recursive: true })

  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const fileId = randomUUID()
  const fileName = `${fileId}.${ext}`
  const absPath = path.join(TEMPLATE_DIR, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(absPath, buffer)
  const relPath = `storage/templates/${fileName}`

  // Generate a unique slug based on the name + a short id
  const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  const slug = `${baseSlug || 'custom'}-${fileId.slice(0, 8)}`

  const created = await db.template.create({
    data: {
      name: name.trim(),
      slug,
      description: 'Custom uploaded template.',
      orientation,
      paperSize,
      accentColor,
      fontFamily: 'Helvetica',
      config: JSON.stringify({ borderStyle: 'minimal', showQr: true, showWatermark: false, showLogo: true, showSeal: false, isCustom: true }),
      backgroundImage: relPath,
      isCustom: true,
      status: 'ACTIVE',
    },
  })

  await db.activityLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action: 'TEMPLATE_CREATED',
      resource: 'Template',
      resourceId: created.id,
      status: 'SUCCESS',
      details: JSON.stringify({ name: created.name, slug: created.slug, custom: true }),
      ipAddress: getClientIp(req),
    },
  })

  return jsonOk(created, 201)
}
