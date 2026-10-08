// Client-safe template config (no fs, no pdf-lib)
export type TemplateSlug =
  | 'classic-blue'
  | 'elegant-gold'
  | 'modern-minimal'
  | 'academic'
  | 'corporate'
  | 'event-celebration'

export interface CertificateData {
  recipientName: string
  eventName: string
  organizationName: string
  certificateTitle: string
  eventDate?: string
  certificateId: string
  department?: string
  role?: string
  duration?: string
  signatoryName?: string
  signatoryDesignation?: string
  venue?: string
  customMessage?: string
  verificationToken: string
  verificationUrl: string
}

export interface TemplateConfig {
  slug: TemplateSlug
  name: string
  description: string
  orientation: 'landscape' | 'portrait'
  paperSize: 'A4' | 'Letter'
  accentColor: string
  fontFamily: string
  borderStyle?: 'double' | 'single' | 'ornate' | 'minimal'
  showQr?: boolean
  showWatermark?: boolean // reserved — watermarks are no longer rendered on downloaded PDFs
  showLogo?: boolean
  showSeal?: boolean
  backgroundImage?: string | null // relative path to a custom background image
  isCustom?: boolean
}

export const TEMPLATES_CONFIG: Record<TemplateSlug, TemplateConfig> = {
  'classic-blue': {
    slug: 'classic-blue',
    name: 'Classic Blue',
    description: 'A timeless certificate with deep blue borders and elegant typography.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#1e3a8a',
    fontFamily: 'Helvetica',
    borderStyle: 'double',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: true,
  },
  'elegant-gold': {
    slug: 'elegant-gold',
    name: 'Elegant Gold',
    description: 'Premium gold accents for awards and honors.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#b8860b',
    fontFamily: 'Times-Roman',
    borderStyle: 'ornate',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: true,
  },
  'modern-minimal': {
    slug: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, contemporary layout with subtle accents.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#0f766e',
    fontFamily: 'Helvetica',
    borderStyle: 'minimal',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: false,
  },
  academic: {
    slug: 'academic',
    name: 'Academic',
    description: 'Scholarly design for universities and academic institutions.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#7c2d12',
    fontFamily: 'Times-Roman',
    borderStyle: 'single',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: true,
  },
  corporate: {
    slug: 'corporate',
    name: 'Corporate',
    description: 'Professional layout for training and corporate certificates.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#1e293b',
    fontFamily: 'Helvetica',
    borderStyle: 'double',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: true,
  },
  'event-celebration': {
    slug: 'event-celebration',
    name: 'Event Celebration',
    description: 'Vibrant design for workshops and event participation.',
    orientation: 'landscape',
    paperSize: 'A4',
    accentColor: '#be185d',
    fontFamily: 'Helvetica',
    borderStyle: 'ornate',
    showQr: true,
    showWatermark: false,
    showLogo: true,
    showSeal: true,
  },
}
