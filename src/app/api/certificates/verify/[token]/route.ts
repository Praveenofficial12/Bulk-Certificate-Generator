import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonError, jsonOk } from '@/lib/api-helpers'

// Public verification - no auth required
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cert = await db.certificate.findUnique({
    where: { verificationToken: token },
    include: { template: true, job: true },
  })
  if (!cert) {
    return jsonError('NOT_FOUND', 'Certificate not found or invalid verification token.', 404)
  }
  return jsonOk({
    certificateId: cert.certificateId,
    recipientName: cert.recipientName,
    eventName: cert.eventName,
    organizationName: cert.organizationName,
    certificateTitle: cert.certificateTitle,
    eventDate: cert.eventDate,
    issuedDate: cert.generatedAt,
    status: cert.status,
    verifiedAt: new Date().toISOString(),
    template: cert.template ? { name: cert.template.name, slug: cert.template.slug } : null,
  })
}
