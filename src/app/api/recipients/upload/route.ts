import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk, getClientIp } from '@/lib/api-helpers'
import { parseFile, applyMapping, autoDetectMapping } from '@/lib/parse'

const ALLOWED_EXT = new Set(['csv', 'xlsx', 'xls', 'txt'])
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return jsonError('NO_FILE', 'No file uploaded.', 400)

  const ext = (file.name.toLowerCase().split('.').pop() ?? '').toLowerCase()
  if (!ALLOWED_EXT.has(ext)) {
    return jsonError(
      'UNSUPPORTED_FILE_TYPE',
      `File type .${ext} is not allowed. Allowed: CSV, XLSX.`,
      400
    )
  }
  if (file.size > MAX_SIZE) {
    return jsonError('FILE_TOO_LARGE', 'File exceeds the 5MB limit.', 413)
  }

  try {
    const parsed = await parseFile(file)
    const mapping = autoDetectMapping(parsed.headers)
    const rows = applyMapping(parsed.rows, mapping)
    await db.activityLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'RECIPIENT_IMPORTED',
        resource: 'Recipient',
        status: 'SUCCESS',
        details: JSON.stringify({ count: rows.length, fileName: file.name }),
        ipAddress: getClientIp(req),
      },
    })
    return jsonOk({
      fileName: file.name,
      totalRows: parsed.totalRows,
      headers: parsed.headers,
      rows: parsed.rows.slice(0, 200), // preview cap for large files
      allRowCount: parsed.rows.length,
      detectedMapping: mapping,
    })
  } catch (e: any) {
    return jsonError('PARSE_FAILED', e?.message ?? 'Failed to parse the uploaded file.', 400)
  }
}
