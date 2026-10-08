// Shared types for Bulk Certificate Generator

export type UserRole = 'ADMIN' | 'STAFF'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string | null
  createdAt: string
}

export type TemplateSlug =
  | 'classic-blue'
  | 'elegant-gold'
  | 'modern-minimal'
  | 'academic'
  | 'corporate'
  | 'event-celebration'

export interface Template {
  id: string
  name: string
  slug: TemplateSlug
  description?: string | null
  orientation: 'landscape' | 'portrait'
  paperSize: 'A4' | 'Letter'
  accentColor: string
  fontFamily: string
  config: string
  backgroundImage?: string | null
  isCustom?: boolean
  isDefault: boolean
  usageCount: number
  status: 'ACTIVE' | 'DRAFT'
  createdAt: string
  updatedAt: string
}

export interface Recipient {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  registrationId?: string | null
  department?: string | null
  institution?: string | null
  event?: string | null
  role?: string | null
  customField1?: string | null
  customField2?: string | null
  status: 'ACTIVE' | 'INVALID' | 'ARCHIVED'
  userId?: string | null
  createdAt: string
  updatedAt: string
}

export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface GenerationJob {
  id: string
  jobId: string
  userId: string
  eventName: string
  organizationName: string
  certificateTitle: string
  description?: string | null
  eventDate?: string | null
  signatoryName?: string | null
  signatoryDesignation?: string | null
  venue?: string | null
  duration?: string | null
  customMessage?: string | null
  templateId: string
  totalRecipients: number
  processedCount: number
  successfulCount: number
  failedCount: number
  progressPercentage: number
  status: JobStatus
  errorMessage?: string | null
  outputZipPath?: string | null
  reportPath?: string | null
  settings: string
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  // joined fields
  template?: Template
  user?: { id: string; name: string; email: string }
}

export interface Certificate {
  id: string
  certificateId: string
  jobId: string
  templateId: string
  userId: string
  recipientName: string
  recipientEmail?: string | null
  department?: string | null
  registrationId?: string | null
  eventName: string
  organizationName: string
  certificateTitle: string
  eventDate?: string | null
  signatoryName?: string | null
  signatoryDesignation?: string | null
  recipientId?: string | null
  filePath: string
  fileName: string
  status: 'GENERATED' | 'FAILED' | 'PENDING'
  errorMessage?: string | null
  verificationToken: string
  generatedAt: string
  createdAt: string
  template?: Template
  job?: { id: string; jobId: string; eventName: string }
}

export interface ActivityLog {
  id: string
  userId?: string | null
  userName: string
  action: string
  resource?: string | null
  resourceId?: string | null
  status: 'SUCCESS' | 'FAILED' | 'INFO'
  ipAddress?: string | null
  details?: string | null
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  message: string
  read: boolean
  link?: string | null
  createdAt: string
}

export interface GenerationSettings {
  format: 'pdf'
  paperSize: 'A4' | 'Letter'
  orientation: 'landscape' | 'portrait'
  certificateIdPrefix: string
  fileNamingPattern: string
  generateZip: boolean
  includeCsvReport: boolean
  sendEmailNotification: boolean
  generateQrCode: boolean
}

export interface RecipientRow {
  name: string
  email?: string
  phone?: string
  registrationId?: string
  department?: string
  institution?: string
  event?: string
  role?: string
  customField1?: string
  customField2?: string
}

export interface ValidationIssue {
  row: number
  field: string
  reason: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  total: number
  valid: number
  invalid: number
  duplicates: number
  validRows: RecipientRow[]
  invalidRows: (RecipientRow & { issues: ValidationIssue[] })[]
  duplicateRows: (RecipientRow & { duplicateOf: number })[]
}

export interface CreateJobPayload {
  eventName: string
  organizationName: string
  certificateTitle: string
  description?: string
  eventDate?: string
  signatoryName?: string
  signatoryDesignation?: string
  venue?: string
  duration?: string
  customMessage?: string
  templateId: string
  recipients: RecipientRow[]
  settings: GenerationSettings
}

export interface AnalyticsOverview {
  totalCertificates: number
  generatedToday: number
  activeJobs: number
  failedCertificates: number
  totalRecipients: number
  successRate: number
  totalJobs: number
  failureRate: number
  avgGenerationTimeSec: number
}

export interface AnalyticsGeneration {
  daily: { date: string; count: number; failed: number }[]
  monthly: { month: string; count: number }[]
  jobStatus: { status: string; count: number }[]
  templateUsage: { templateId: string; name: string; count: number }[]
  topEvents: { eventName: string; count: number }[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
