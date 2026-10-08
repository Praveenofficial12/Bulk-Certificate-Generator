import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, jsonError, jsonOk } from '@/lib/api-helpers'
import { TEMPLATES_CONFIG, generateCertificatePdf, type CertificateData } from '@/lib/certificate-engine'
import path from 'path'
import fs from 'fs'

// Generate a preview certificate (single recipient) without persisting
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest(req)
  if (!user) return jsonError('UNAUTHORIZED', 'Authentication required.', 401)
  const { id } = await params
  const cert = await db.certificate.findFirst({
    where: { OR: [{ id }, { certificateId: id }], userId: user.id },
    include: { template: true, job: true },
  })
  if (!cert) return jsonError('NOT_FOUND', 'Certificate not found.', 404)
  // serve existing PDF if generated
  if (cert.status === 'GENERATED' && cert.filePath) {
    const abs = path.join(process.cwd(), cert.filePath)
    if (fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs)
      return new NextResponse(new Uint8Array(buf), {
        headers: { 'Content-Type': 'application/pdf' },
      })
    }
  }
  // Otherwise regenerate on the fly from template
  try {
    const templateSlug = cert.template.slug as keyof typeof TEMPLATES_CONFIG
    const baseCfg = TEMPLATES_CONFIG[templateSlug] ?? TEMPLATES_CONFIG['classic-blue']
    // Merge custom-template fields from the DB record
    const tplCfg = {
      ...baseCfg,
      accentColor: cert.template.accentColor ?? baseCfg.accentColor,
      orientation: (cert.template.orientation as 'landscape' | 'portrait') ?? baseCfg.orientation,
      paperSize: (cert.template.paperSize as 'A4' | 'Letter') ?? baseCfg.paperSize,
      backgroundImage: cert.template.backgroundImage ?? null,
      isCustom: cert.template.isCustom || false,
    }
    const tmpDir = path.join(process.cwd(), 'storage', 'preview')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    const tmpFile = path.join(tmpDir, `${cert.id}-preview.pdf`)
    const data: CertificateData = {
      recipientName: cert.recipientName,
      eventName: cert.eventName,
      organizationName: cert.organizationName,
      certificateTitle: cert.certificateTitle,
      eventDate: cert.eventDate ?? undefined,
      certificateId: cert.certificateId,
      department: cert.department ?? undefined,
      role: undefined,
      duration: undefined,
      signatoryName: cert.signatoryName ?? undefined,
      signatoryDesignation: cert.signatoryDesignation ?? undefined,
      venue: undefined,
      customMessage: undefined,
      verificationToken: cert.verificationToken,
      verificationUrl: `${process.env.FRONTEND_URL ?? ''}/?verify=${cert.verificationToken}`,
    }
    await generateCertificatePdf(data, tplCfg, tmpFile)
    const buf = fs.readFileSync(tmpFile)
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': 'application/pdf' },
    })
  } catch (e: any) {
    return jsonError('PREVIEW_FAILED', e?.message ?? 'Failed to generate preview.', 500)
  }
}
