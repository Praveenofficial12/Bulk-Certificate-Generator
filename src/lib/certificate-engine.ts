import 'server-only'
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
} from 'pdf-lib'
import { TEMPLATES_CONFIG } from './certificate-config'
import type { TemplateConfig, TemplateSlug, CertificateData } from './certificate-config'
import fs from 'fs'
import path from 'path'

export { TEMPLATES_CONFIG }
export type { TemplateConfig, TemplateSlug, CertificateData }

// Re-export for backward compatibility
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return [r, g, b]
}

function withAlpha(c: [number, number, number], a: number): [number, number, number] {
  return [c[0], c[1] * a + (1 - a) * 1, c[2] * a + (1 - a) * 1]
}

export function ensureOutputDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Lazy QR lib loader
let qrcodeLib: typeof import('qrcode') | null = null
async function getQrLib() {
  if (qrcodeLib) return qrcodeLib
  try {
    qrcodeLib = await import('qrcode')
    return qrcodeLib
  } catch {
    return null
  }
}

async function generateQrPng(text: string, size = 120): Promise<Uint8Array | null> {
  const lib = await getQrLib()
  if (!lib) return null
  try {
    const dataUrl = await lib.toDataURL(text, { margin: 1, width: size, errorCorrectionLevel: 'M' })
    const base64 = dataUrl.split(',')[1]
    const buf = Buffer.from(base64, 'base64')
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

function pageSize(paper: 'A4' | 'Letter', orientation: 'landscape' | 'portrait') {
  const sizes = {
    A4: [595.28, 841.89],
    Letter: [612, 792],
  } as const
  const [w, h] = sizes[paper]
  return orientation === 'landscape' ? { width: h, height: w } : { width: w, height: h }
}

function fitNameSize(text: string, maxWidth: number, baseSize: number): number {
  const avgWidth = 0.55
  const estWidth = text.length * baseSize * avgWidth
  if (estWidth <= maxWidth) return baseSize
  const scaled = (maxWidth / estWidth) * baseSize
  return Math.max(Math.floor(scaled), 16)
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const tryLine = current ? `${current} ${w}` : w
    const width = font.widthOfTextAtSize(tryLine, size)
    if (width <= maxWidth) {
      current = tryLine
    } else {
      if (current) lines.push(current)
      current = w
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function generateCertificatePdf(
  data: CertificateData,
  template: TemplateConfig,
  outPath: string
): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const fontKey = template.fontFamily === 'Times-Roman' ? 'TimesRoman' : 'Helvetica'
  const font = await pdfDoc.embedFont(StandardFonts[fontKey as keyof typeof StandardFonts])
  const boldKey = template.fontFamily === 'Times-Roman' ? 'TimesRomanBold' : 'HelveticaBold'
  const boldFont = await pdfDoc.embedFont(StandardFonts[boldKey as keyof typeof StandardFonts])
  const italicKey = template.fontFamily === 'Times-Roman' ? 'TimesRomanItalic' : 'HelveticaOblique'
  const italicFont = await pdfDoc.embedFont(StandardFonts[italicKey as keyof typeof StandardFonts])

  const { width, height } = pageSize(template.paperSize, template.orientation)
  const page = pdfDoc.addPage([width, height])

  const accent = hexToRgb(template.accentColor)
  const accentRgb = rgb(accent[0], accent[1], accent[2])
  const accentLight = rgb(...withAlpha(accent, 0.12))
  const accentMid = rgb(...withAlpha(accent, 0.5))

  const margin = 30

  // === Decorative border ===
  const b = template.borderStyle ?? 'double'
  if (b === 'minimal') {
    page.drawRectangle({ x: margin, y: height - margin - 6, width: width - margin * 2, height: 6, color: accentRgb })
    page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: 6, color: accentRgb })
  } else if (b === 'single') {
    page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: height - margin * 2, borderColor: accentRgb, borderWidth: 2.5 })
  } else if (b === 'double') {
    page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: height - margin * 2, borderColor: accentRgb, borderWidth: 3 })
    page.drawRectangle({ x: margin + 8, y: margin + 8, width: width - margin * 2 - 16, height: height - margin * 2 - 16, borderColor: accentRgb, borderWidth: 1 })
  } else {
    // ornate
    page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: height - margin * 2, borderColor: accentRgb, borderWidth: 4 })
    page.drawRectangle({ x: margin + 6, y: margin + 6, width: width - margin * 2 - 12, height: height - margin * 2 - 12, borderColor: accentRgb, borderWidth: 1 })
    page.drawRectangle({ x: margin + 14, y: margin + 14, width: width - margin * 2 - 28, height: height - margin * 2 - 28, borderColor: accentMid, borderWidth: 0.5 })
    const cs = 18
    const corners = [
      { x: margin, y: height - margin - cs },
      { x: width - margin - cs, y: height - margin - cs },
      { x: margin, y: margin },
      { x: width - margin - cs, y: margin },
    ]
    corners.forEach((c) => {
      page.drawRectangle({ x: c.x, y: c.y, width: cs, height: cs, color: accentRgb })
    })
  }

  // === Watermark ===
  if (template.showWatermark) {
    const wm = 'CERTIFICATE'
    const wmSize = 110
    const wmWidth = font.widthOfTextAtSize(wm, wmSize)
    page.drawText(wm, {
      x: (width - wmWidth) / 2,
      y: height / 2 - wmSize / 2 + 20,
      size: wmSize,
      font,
      color: rgb(...withAlpha(accent, 0.05)),
      rotate: degrees(30),
    })
  }

  const cx = width / 2
  const topY = height - 90

  // === Logo badge ===
  if (template.showLogo) {
    const badgeR = 26
    const badgeX = cx
    const badgeY = topY + 4
    page.drawCircle({ x: badgeX, y: badgeY, color: accentRgb, size: badgeR * 2 })
    page.drawCircle({ x: badgeX, y: badgeY, color: rgb(1, 1, 1), size: badgeR * 2 - 8 })
    page.drawCircle({ x: badgeX, y: badgeY, color: accentRgb, size: 16 })
    const orgInitial = (data.organizationName || 'C').charAt(0).toUpperCase()
    const orgW = boldFont.widthOfTextAtSize(orgInitial, 22)
    page.drawText(orgInitial, {
      x: badgeX - orgW / 2,
      y: badgeY - 7,
      size: 22,
      font: boldFont,
      color: rgb(1, 1, 1),
    })
    const orgName = (data.organizationName || '').toUpperCase()
    const orgSize = 13
    const orgWidth = boldFont.widthOfTextAtSize(orgName, orgSize)
    page.drawText(orgName, {
      x: cx - orgWidth / 2,
      y: badgeY - badgeR - 22,
      size: orgSize,
      font: boldFont,
      color: accentRgb,
    })
  }

  // === Certificate Title ===
  const title = (data.certificateTitle || 'CERTIFICATE OF PARTICIPATION').toUpperCase()
  const titleSize = 30
  const titleW = boldFont.widthOfTextAtSize(title, titleSize)
  page.drawText(title, {
    x: cx - titleW / 2,
    y: topY - 60,
    size: titleSize,
    font: boldFont,
    color: accentRgb,
  })
  page.drawRectangle({
    x: cx - 60,
    y: topY - 72,
    width: 120,
    height: 2,
    color: accentRgb,
  })

  // === "presented to" ===
  const presentedText = 'This certificate is proudly presented to'
  const presentedSize = 12
  const presentedW = italicFont.widthOfTextAtSize(presentedText, presentedSize)
  page.drawText(presentedText, {
    x: cx - presentedW / 2,
    y: topY - 100,
    size: presentedSize,
    font: italicFont,
    color: rgb(0.35, 0.35, 0.4),
  })

  // === Recipient name (auto-fit) ===
  const maxNameWidth = width - margin * 2 - 80
  const baseNameSize = 28
  const nameSize = fitNameSize(data.recipientName, maxNameWidth, baseNameSize)
  const nameW = boldFont.widthOfTextAtSize(data.recipientName, nameSize)
  page.drawText(data.recipientName, {
    x: cx - nameW / 2,
    y: topY - 140,
    size: nameSize,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.15),
  })
  page.drawRectangle({
    x: cx - nameW / 2,
    y: topY - 150,
    width: nameW,
    height: 1,
    color: accentMid,
  })

  // === Achievement statement ===
  const achievement = data.customMessage?.trim()
    ? data.customMessage
    : 'for successfully participating in'
  const aSize = 12
  const aW = italicFont.widthOfTextAtSize(achievement, aSize)
  page.drawText(achievement, {
    x: cx - aW / 2,
    y: topY - 175,
    size: aSize,
    font: italicFont,
    color: rgb(0.35, 0.35, 0.4),
  })

  // === Event name ===
  const eventLines = wrapText(data.eventName, font, 16, width - margin * 2 - 100)
  let yE = topY - 200
  for (const line of eventLines.slice(0, 2)) {
    const lineW = boldFont.widthOfTextAtSize(line, 16)
    page.drawText(line, {
      x: cx - lineW / 2,
      y: yE,
      size: 16,
      font: boldFont,
      color: rgb(0.15, 0.15, 0.2),
    })
    yE -= 22
  }

  // === "organized by" ===
  const orgByText = 'organized by'
  const orgByW = italicFont.widthOfTextAtSize(orgByText, 11)
  page.drawText(orgByText, {
    x: cx - orgByW / 2,
    y: yE - 8,
    size: 11,
    font: italicFont,
    color: rgb(0.4, 0.4, 0.45),
  })

  // === meta ===
  const metaParts: string[] = []
  if (data.department) metaParts.push(`Department: ${data.department}`)
  if (data.role) metaParts.push(`Role: ${data.role}`)
  if (data.duration) metaParts.push(`Duration: ${data.duration}`)
  if (data.venue) metaParts.push(`Venue: ${data.venue}`)
  if (data.eventDate) metaParts.push(`Date: ${data.eventDate}`)
  const metaText = metaParts.join('   •   ')
  if (metaText) {
    const metaLines = wrapText(metaText, font, 11, width - margin * 2 - 120)
    let yM = yE - 32
    for (const line of metaLines.slice(0, 2)) {
      const lw = font.widthOfTextAtSize(line, 11)
      page.drawText(line, {
        x: cx - lw / 2,
        y: yM,
        size: 11,
        font,
        color: rgb(0.4, 0.4, 0.45),
      })
      yM -= 16
    }
  }

  // === Footer ===
  const footerY = margin + 50
  const sigX = margin + 80
  const sigW = 160
  page.drawRectangle({ x: sigX, y: footerY + 38, width: sigW, height: 1, color: rgb(0.5, 0.5, 0.55) })
  if (data.signatoryName) {
    const snW = boldFont.widthOfTextAtSize(data.signatoryName, 12)
    page.drawText(data.signatoryName, { x: sigX + (sigW - snW) / 2, y: footerY + 22, size: 12, font: boldFont, color: rgb(0.15, 0.15, 0.2) })
  }
  if (data.signatoryDesignation) {
    const sdW = font.widthOfTextAtSize(data.signatoryDesignation, 9)
    page.drawText(data.signatoryDesignation, { x: sigX + (sigW - sdW) / 2, y: footerY + 10, size: 9, font, color: rgb(0.45, 0.45, 0.5) })
  }
  page.drawText('Authorized Signature', {
    x: sigX,
    y: footerY + 48,
    size: 8,
    font: italicFont,
    color: rgb(0.45, 0.45, 0.5),
  })

  // Seal
  if (template.showSeal) {
    const sealX = cx
    const sealY = footerY + 30
    page.drawCircle({ x: sealX, y: sealY, color: rgb(0.85, 0.65, 0.1), size: 50 })
    page.drawCircle({ x: sealX, y: sealY, color: rgb(1, 1, 1), size: 42 })
    page.drawCircle({ x: sealX, y: sealY, color: rgb(0.85, 0.65, 0.1), size: 34 })
    const s1 = boldFont.widthOfTextAtSize('OFFICIAL', 7)
    const s2 = boldFont.widthOfTextAtSize('SEAL', 7)
    page.drawText('OFFICIAL', { x: sealX - s1 / 2, y: sealY + 4, size: 7, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('SEAL', { x: sealX - s2 / 2, y: sealY - 6, size: 7, font: boldFont, color: rgb(1, 1, 1) })
  }

  // Cert ID + date
  const cidX = width - margin - 200
  page.drawRectangle({ x: cidX, y: footerY + 38, width: 160, height: 1, color: rgb(0.5, 0.5, 0.55) })
  page.drawText(`Certificate ID: ${data.certificateId}`, { x: cidX, y: footerY + 22, size: 10, font: boldFont, color: accentRgb })
  if (data.eventDate) {
    page.drawText(`Date: ${data.eventDate}`, { x: cidX, y: footerY + 8, size: 9, font, color: rgb(0.4, 0.4, 0.45) })
  }

  // QR code
  if (template.showQr) {
    const qrData = await generateQrPng(data.verificationUrl, 120)
    if (qrData) {
      const qrImg = await pdfDoc.embedPng(qrData)
      const qrSize = 70
      const qrX = width - margin - 70
      const qrY = margin + 14
      page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })
      page.drawText('Scan to verify', {
        x: qrX - 6,
        y: qrY - 10,
        size: 7,
        font: italicFont,
        color: rgb(0.4, 0.4, 0.45),
      })
    }
  }

  const bytes = await pdfDoc.save()
  ensureOutputDir(path.dirname(outPath))
  fs.writeFileSync(outPath, bytes)
}

export function rgbColor(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  return rgb(r, g, b)
}
