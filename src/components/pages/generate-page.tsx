'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Layers,
  Loader2,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
  X,
  AlertCircle,
  Eye,
  AlertTriangle,
  FileText,
  Zap,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import type { Template, RecipientRow, GenerationSettings, CreateJobPayload } from '@/lib/types'
import { MotionButton } from '@/components/motion-button'
import { CertificatePreview } from '@/components/certificate-preview'
import { toast } from 'sonner'
import {
  parseFile,
  generateSampleCsv,
  applyMapping,
  autoDetectMapping,
  validateRecipients,
  type ColumnMapping,
  type ParsedFile,
} from '@/lib/parse'
import { downloadBlob, safeFileName, isValidEmail } from '@/lib/format'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TEMPLATES_CONFIG } from '@/lib/certificate-config'
import type { CertificateData, TemplateSlug } from '@/lib/certificate-config'

const STEPS = [
  { id: 1, label: 'Event Info', icon: Info },
  { id: 2, label: 'Recipients', icon: Users },
  { id: 3, label: 'Validation', icon: CheckCircle2 },
  { id: 4, label: 'Template', icon: Layers },
  { id: 5, label: 'Preview', icon: Eye },
  { id: 6, label: 'Settings', icon: SettingsIcon },
  { id: 7, label: 'Review', icon: Check },
]

interface EventInfo {
  eventName: string
  organizationName: string
  eventDate: string
  certificateTitle: string
  description: string
  signatoryName: string
  signatoryDesignation: string
  certificateIdPrefix: string
  venue: string
  duration: string
  customMessage: string
}

const DEFAULT_EVENT: EventInfo = {
  eventName: 'AI & Innovation Workshop 2026',
  organizationName: 'V.S.B Engineering College',
  eventDate: '2026-01-15',
  certificateTitle: 'Certificate of Participation',
  description: 'A 3-day hands-on workshop on artificial intelligence, machine learning, and innovation.',
  signatoryName: 'Dr. R. Krishnan',
  signatoryDesignation: 'Dean of Innovation',
  certificateIdPrefix: 'VSB-AI-2026',
  venue: 'Innovation Hub, Block C',
  duration: '3 days',
  customMessage: '',
}

export function GeneratePage() {
  const navigate = useNav((s) => s.navigate)
  const [step, setStep] = useState(1)
  const [eventInfo, setEventInfo] = useState<EventInfo>(DEFAULT_EVENT)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [uploading, setUploading] = useState(false)
  const [validation, setValidation] = useState<ReturnType<typeof validateRecipients> | null>(null)
  const [manualRecipients, setManualRecipients] = useState<RecipientRow[]>([{ name: '', email: '' }])
  const [recipientSource, setRecipientSource] = useState<'upload' | 'manual'>('upload')
  const [settings, setSettings] = useState<GenerationSettings>({
    format: 'pdf',
    paperSize: 'A4',
    orientation: 'landscape',
    certificateIdPrefix: 'VSB-AI-2026',
    fileNamingPattern: '{certificate_id}_{recipient_name}.pdf',
    generateZip: true,
    includeCsvReport: true,
    sendEmailNotification: false,
    generateQrCode: true,
  })
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<Template[]>('/templates').then((t) => {
      setTemplates(t)
      const def = t.find((x) => x.isDefault) ?? t[0]
      if (def) setSelectedTemplate(def.id)
    }).catch(() => toast.error('Failed to load templates'))
  }, [])

  // Re-validate when recipients change
  const recipients: RecipientRow[] = useMemo(() => {
    if (recipientSource === 'manual') return manualRecipients.filter((r) => r.name)
    if (parsedFile && mapping) return applyMapping(parsedFile.rows, mapping)
    return []
  }, [recipientSource, manualRecipients, parsedFile, mapping])

  useEffect(() => {
    if (recipients.length > 0) {
      setValidation(validateRecipients(recipients))
    } else {
      setValidation(null)
    }
  }, [recipients])

  // sync prefix
  useEffect(() => {
    setSettings((s) => ({ ...s, certificateIdPrefix: eventInfo.certificateIdPrefix || 'CERT' }))
  }, [eventInfo.certificateIdPrefix])

  const validRecipients = validation?.validRows ?? []
  const canProceed = step !== 2 || recipients.length > 0

  function next() {
    if (step < 7) setStep(step + 1)
  }
  function prev() {
    if (step > 1) setStep(step - 1)
  }

  // File upload
  const onDrop = async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.upload<{ fileName: string; totalRows: number; headers: string[]; rows: Record<string, string>[]; allRowCount: number; detectedMapping: ColumnMapping }>('/recipients/upload', formData)
      setParsedFile({ headers: res.headers, rows: res.rows, totalRows: res.allRowCount })
      setMapping(res.detectedMapping)
      toast.success(`Parsed ${res.allRowCount} rows from ${res.fileName}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  })

  async function downloadSample() {
    try {
      const blob = await api.blob('/recipients/sample')
      downloadBlob(blob, 'bulk-certificates-sample.csv')
    } catch (e: any) {
      // fallback to local
      const blob = generateSampleCsv()
      downloadBlob(blob, 'bulk-certificates-sample.csv')
    }
  }

  async function generate() {
    setShowConfirm(false)
    setSubmitting(true)
    try {
      const payload: CreateJobPayload = {
        eventName: eventInfo.eventName,
        organizationName: eventInfo.organizationName,
        certificateTitle: eventInfo.certificateTitle,
        description: eventInfo.description,
        eventDate: eventInfo.eventDate,
        signatoryName: eventInfo.signatoryName,
        signatoryDesignation: eventInfo.signatoryDesignation,
        venue: eventInfo.venue,
        duration: eventInfo.duration,
        customMessage: eventInfo.customMessage,
        templateId: selectedTemplate,
        recipients: validRecipients,
        settings,
      }
      const res = await api.post<{ id: string; jobId: string; totalRecipients: number; skippedInvalid: number }>('/generation/jobs', payload)
      toast.success(`Job ${res.jobId} created. Generating ${res.totalRecipients} certificates...`)
      navigate('progress', { jobId: res.id })
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to create job')
      setSubmitting(false)
    }
  }

  const previewData: Partial<CertificateData> = {
    recipientName: validRecipients[0]?.name || '{{recipient_name}}',
    eventName: eventInfo.eventName || '{{event_name}}',
    organizationName: eventInfo.organizationName || '{{organization_name}}',
    certificateTitle: eventInfo.certificateTitle || 'Certificate of Participation',
    eventDate: eventInfo.eventDate || '{{event_date}}',
    certificateId: `${eventInfo.certificateIdPrefix}-0001` || '{{certificate_id}}',
    department: validRecipients[0]?.department,
    signatoryName: eventInfo.signatoryName || '{{signatory_name}}',
    signatoryDesignation: eventInfo.signatoryDesignation || '{{signatory_designation}}',
    venue: eventInfo.venue,
    duration: eventInfo.duration,
    customMessage: eventInfo.customMessage,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Generate Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Follow the steps to create a bulk generation job.</p>
        </div>
        <MotionButton variant="outline" size="md" onClick={() => navigate('dashboard')}>
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </MotionButton>
      </div>

      {/* Stepper */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex min-w-max items-center gap-1">
          {STEPS.map((s, i) => {
            const done = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  disabled={step <= s.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    active ? 'bg-primary/10 text-primary' : done ? 'text-foreground hover:bg-accent' : 'text-muted-foreground'
                  )}
                >
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                    active ? 'bg-primary text-primary-foreground' : done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <span className="font-medium">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('mx-1 h-px w-6', step > s.id ? 'bg-emerald-400' : 'bg-border')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 1: Event Info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Event & Certificate Information</h2>
                    <p className="text-sm text-muted-foreground">Provide details about the event and the certificate.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Event Name" required>
                      <Input value={eventInfo.eventName} onChange={(e) => setEventInfo({ ...eventInfo, eventName: e.target.value })} placeholder="AI & Innovation Workshop 2026" />
                    </Field>
                    <Field label="Organization Name" required>
                      <Input value={eventInfo.organizationName} onChange={(e) => setEventInfo({ ...eventInfo, organizationName: e.target.value })} placeholder="V.S.B Engineering College" />
                    </Field>
                    <Field label="Event Date">
                      <Input type="date" value={eventInfo.eventDate} onChange={(e) => setEventInfo({ ...eventInfo, eventDate: e.target.value })} />
                    </Field>
                    <Field label="Certificate Title" required>
                      <Input value={eventInfo.certificateTitle} onChange={(e) => setEventInfo({ ...eventInfo, certificateTitle: e.target.value })} placeholder="Certificate of Participation" />
                    </Field>
                    <Field label="Signatory Name">
                      <Input value={eventInfo.signatoryName} onChange={(e) => setEventInfo({ ...eventInfo, signatoryName: e.target.value })} placeholder="Dr. R. Krishnan" />
                    </Field>
                    <Field label="Signatory Designation">
                      <Input value={eventInfo.signatoryDesignation} onChange={(e) => setEventInfo({ ...eventInfo, signatoryDesignation: e.target.value })} placeholder="Dean of Innovation" />
                    </Field>
                    <Field label="Certificate ID Prefix" required>
                      <Input value={eventInfo.certificateIdPrefix} onChange={(e) => setEventInfo({ ...eventInfo, certificateIdPrefix: e.target.value })} placeholder="VSB-AI-2026" />
                    </Field>
                    <Field label="Venue (optional)">
                      <Input value={eventInfo.venue} onChange={(e) => setEventInfo({ ...eventInfo, venue: e.target.value })} placeholder="Innovation Hub, Block C" />
                    </Field>
                    <Field label="Duration (optional)">
                      <Input value={eventInfo.duration} onChange={(e) => setEventInfo({ ...eventInfo, duration: e.target.value })} placeholder="3 days" />
                    </Field>
                  </div>
                  <Field label="Description">
                    <Textarea value={eventInfo.description} onChange={(e) => setEventInfo({ ...eventInfo, description: e.target.value })} rows={2} placeholder="Brief description of the event..." />
                  </Field>
                  <Field label="Custom Message (optional)">
                    <Input value={eventInfo.customMessage} onChange={(e) => setEventInfo({ ...eventInfo, customMessage: e.target.value })} placeholder="for successfully participating in" />
                  </Field>
                </div>
              )}

              {/* STEP 2: Recipients */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Recipient Data</h2>
                    <p className="text-sm text-muted-foreground">Upload a CSV/Excel file or manually add recipients.</p>
                  </div>

                  {/* Source toggle */}
                  <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
                    <button
                      onClick={() => setRecipientSource('upload')}
                      className={cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-sm', recipientSource === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                    >
                      <Upload className="h-4 w-4" /> Upload file
                    </button>
                    <button
                      onClick={() => setRecipientSource('manual')}
                      className={cn('flex items-center gap-2 rounded-md px-3 py-1.5 text-sm', recipientSource === 'manual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
                    >
                      <UserIcon className="h-4 w-4" /> Manual entry
                    </button>
                  </div>

                  {recipientSource === 'upload' && (
                    <div className="space-y-4">
                      <div
                        {...getRootProps()}
                        className={cn(
                          'cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors',
                          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        )}
                      >
                        <input {...getInputProps()} />
                        <motion.div animate={{ scale: isDragActive ? 1.05 : 1 }} className="flex flex-col items-center gap-2">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                          </div>
                          <div className="text-base font-semibold text-foreground">
                            {uploading ? 'Parsing file...' : 'Drop your recipient file here'}
                          </div>
                          <div className="text-sm text-muted-foreground">CSV or XLSX supported · Max 5MB</div>
                          <button type="button" className="mt-2 text-xs font-medium text-primary hover:underline">
                            Browse files
                          </button>
                        </motion.div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button onClick={downloadSample} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Download className="h-3.5 w-3.5" /> Download sample CSV template
                        </button>
                        {parsedFile && (
                          <button onClick={() => { setParsedFile(null); setMapping(null) }} className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:underline">
                            <X className="h-3.5 w-3.5" /> Clear file
                          </button>
                        )}
                      </div>

                      {/* Column mapping */}
                      {parsedFile && mapping && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground">Map columns</div>
                              <div className="text-xs text-muted-foreground">{parsedFile.totalRows} rows parsed. {parsedFile.headers.length} columns detected.</div>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(mapping).map(([field, source]) => (
                              <div key={field}>
                                <Label className="text-xs capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                <Select value={source} onValueChange={(v) => setMapping({ ...mapping, [field]: v })}>
                                  <SelectTrigger className="h-9 mt-1">
                                    <SelectValue placeholder="— Skip —" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">— Skip —</SelectItem>
                                    {parsedFile.headers.map((h) => (
                                      <SelectItem key={h} value={h}>{h}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                          {/* Preview table */}
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">Preview (first 5 rows)</div>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin">
                              <table className="w-full text-xs">
                                <thead className="bg-muted/30 sticky top-0">
                                  <tr>
                                    {parsedFile.headers.slice(0, 6).map((h) => (
                                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {parsedFile.rows.slice(0, 5).map((r, i) => (
                                    <tr key={i} className="border-t border-border">
                                      {parsedFile.headers.slice(0, 6).map((h) => (
                                        <td key={h} className="px-3 py-2 text-foreground truncate max-w-[140px]">{r[h]}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {recipientSource === 'manual' && (
                    <div className="space-y-3">
                      {manualRecipients.map((r, i) => (
                        <div key={i} className="flex items-end gap-2">
                          <Field label={`Recipient ${i + 1} name`} className="flex-1">
                            <Input value={r.name} onChange={(e) => {
                              const next = [...manualRecipients]
                              next[i] = { ...next[i], name: e.target.value }
                              setManualRecipients(next)
                            }} placeholder="Full name" />
                          </Field>
                          <Field label="Email" className="flex-1">
                            <Input value={r.email ?? ''} onChange={(e) => {
                              const next = [...manualRecipients]
                              next[i] = { ...next[i], email: e.target.value }
                              setManualRecipients(next)
                            }} placeholder="email@example.com" />
                          </Field>
                          <Field label="Department" className="flex-1 hidden sm:block">
                            <Input value={r.department ?? ''} onChange={(e) => {
                              const next = [...manualRecipients]
                              next[i] = { ...next[i], department: e.target.value }
                              setManualRecipients(next)
                            }} placeholder="CSE" />
                          </Field>
                          <button
                            onClick={() => setManualRecipients(manualRecipients.filter((_, idx) => idx !== i))}
                            className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <MotionButton variant="outline" size="sm" onClick={() => setManualRecipients([...manualRecipients, { name: '', email: '' }])}>
                        <UserIcon className="h-4 w-4" /> Add recipient
                      </MotionButton>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Validation */}
              {step === 3 && (
                <ValidationStep validation={validation} recipients={recipients} onRemoveInvalid={() => {
                  if (!validation) return
                  // Replace manual/upload data with only valid rows
                  if (recipientSource === 'manual') {
                    setManualRecipients(validation.validRows)
                  } else if (parsedFile && mapping) {
                    // Rebuild parsed rows to only valid - simpler: keep mapping but filter
                    const validSet = new Set(validation.validRows.map((r) => JSON.stringify(r)))
                    setParsedFile({ ...parsedFile, rows: parsedFile.rows.filter((_, i) => {
                      const row = applyMapping([parsedFile.rows[i]], mapping!)[0]
                      return validation.validRows.some((v) => v.name === row.name && v.email === row.email)
                    }), totalRows: validation.validRows.length })
                  }
                  toast.success('Invalid rows removed')
                }} onDownloadErrors={() => {
                  if (!validation) return
                  const rows = [
                    ...validation.invalidRows.map((r) => ({ name: r.name, email: r.email ?? '', issues: r.issues.map((i) => i.reason).join('; ') })),
                    ...validation.duplicateRows.map((r) => ({ name: r.name, email: r.email ?? '', issues: 'Duplicate' })),
                  ]
                  const csv = ['name,email,issues', ...rows.map((r) => `"${r.name}","${r.email}","${r.issues}"`)].join('\n')
                  downloadBlob(new Blob([csv], { type: 'text/csv' }), 'error-report.csv')
                }} />
              )}

              {/* STEP 4: Template */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Select Certificate Template</h2>
                    <p className="text-sm text-muted-foreground">Choose a professional template for your certificates.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => {
                      const slug = t.slug as TemplateSlug
                      const active = selectedTemplate === t.id
                      return (
                        <motion.button
                          key={t.id}
                          whileHover={{ y: -4 }}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={cn(
                            'group relative rounded-2xl border-2 p-3 text-left transition-colors',
                            active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                          )}
                        >
                          <CertificatePreview
                            slug={slug}
                            data={previewData}
                          />
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground">{t.name}</div>
                              <div className="text-[10px] text-muted-foreground">{t.orientation} · {t.paperSize}</div>
                            </div>
                            {active && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: Preview */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Certificate Preview</h2>
                    <p className="text-sm text-muted-foreground">This is how the generated certificates will look.</p>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <div className="mx-auto max-w-2xl">
                        <CertificatePreview
                          slug={(templates.find((t) => t.id === selectedTemplate)?.slug ?? 'classic-blue') as TemplateSlug}
                          data={previewData}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border bg-muted/30 p-4">
                        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Placeholders used</div>
                        <ul className="space-y-1.5 text-xs">
                          {[
                            ['recipient_name', previewData.recipientName],
                            ['event_name', previewData.eventName],
                            ['organization_name', previewData.organizationName],
                            ['certificate_title', previewData.certificateTitle],
                            ['event_date', previewData.eventDate],
                            ['certificate_id', previewData.certificateId],
                            ['department', previewData.department || '—'],
                            ['signatory_name', previewData.signatoryName],
                            ['signatory_designation', previewData.signatoryDesignation],
                          ].map(([k, v]) => (
                            <li key={k as string} className="flex items-center justify-between gap-2">
                              <code className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{`{{${k}}}`}</code>
                              <span className="text-foreground truncate">{v as string}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-border p-4 text-xs text-muted-foreground">
                        <Info className="inline h-3.5 w-3.5 mr-1" /> Each recipient will receive a unique certificate ID and verification token.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Settings */}
              {step === 6 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Generation Settings</h2>
                    <p className="text-sm text-muted-foreground">Configure the output format and options.</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Certificate format">
                      <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 text-sm">
                        <FileText className="h-4 w-4 text-primary" /> PDF
                      </div>
                    </Field>
                    <Field label="Paper size">
                      <Select value={settings.paperSize} onValueChange={(v) => setSettings({ ...settings, paperSize: v as any })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                          <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Orientation">
                      <RadioGroup value={settings.orientation} onValueChange={(v) => setSettings({ ...settings, orientation: v as any })} className="flex gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="landscape" id="land" />
                          <Label htmlFor="land">Landscape</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="portrait" id="port" />
                          <Label htmlFor="port">Portrait</Label>
                        </div>
                      </RadioGroup>
                    </Field>
                    <Field label="Certificate ID prefix">
                      <Input value={settings.certificateIdPrefix} onChange={(e) => setSettings({ ...settings, certificateIdPrefix: e.target.value })} placeholder="VSB-AI-2026" />
                    </Field>
                    <Field label="File naming pattern" className="sm:col-span-2">
                      <Input value={settings.fileNamingPattern} onChange={(e) => setSettings({ ...settings, fileNamingPattern: e.target.value })} placeholder="{certificate_id}_{recipient_name}.pdf" />
                      <p className="mt-1 text-xs text-muted-foreground">Available tokens: <code>{'{certificate_id}'}</code>, <code>{'{recipient_name}'}</code></p>
                    </Field>
                  </div>
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={settings.generateZip} onChange={(e) => setSettings({ ...settings, generateZip: e.target.checked })} className="h-4 w-4 rounded border-border" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Generate ZIP package</div>
                        <div className="text-xs text-muted-foreground">All certificates bundled as a downloadable ZIP file.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={settings.includeCsvReport} onChange={(e) => setSettings({ ...settings, includeCsvReport: e.target.checked })} className="h-4 w-4 rounded border-border" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Include CSV report</div>
                        <div className="text-xs text-muted-foreground">A generation report CSV is added to the ZIP.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={settings.generateQrCode} onChange={(e) => setSettings({ ...settings, generateQrCode: e.target.checked })} className="h-4 w-4 rounded border-border" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Generate QR verification code</div>
                        <div className="text-xs text-muted-foreground">A scannable QR code links to the certificate verification page.</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer opacity-60">
                      <input type="checkbox" checked={settings.sendEmailNotification} onChange={(e) => setSettings({ ...settings, sendEmailNotification: e.target.checked })} className="h-4 w-4 rounded border-border" disabled />
                      <div>
                        <div className="text-sm font-medium text-foreground">Send email notification <span className="text-[10px] rounded bg-muted px-1.5 py-0.5">soon</span></div>
                        <div className="text-xs text-muted-foreground">Email recipients when their certificate is ready (SMTP integration).</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 7: Review */}
              {step === 7 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Review & Generate</h2>
                    <p className="text-sm text-muted-foreground">Confirm the details below and start the bulk generation job.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReviewCard title="Event">
                      <Row label="Event" value={eventInfo.eventName} />
                      <Row label="Organization" value={eventInfo.organizationName} />
                      <Row label="Date" value={eventInfo.eventDate || '—'} />
                      <Row label="Title" value={eventInfo.certificateTitle} />
                      <Row label="Signatory" value={`${eventInfo.signatoryName || '—'} (${eventInfo.signatoryDesignation || '—'})`} />
                    </ReviewCard>
                    <ReviewCard title="Template & Settings">
                      <Row label="Template" value={templates.find((t) => t.id === selectedTemplate)?.name ?? '—'} />
                      <Row label="Paper" value={`${settings.paperSize} · ${settings.orientation}`} />
                      <Row label="Prefix" value={settings.certificateIdPrefix} />
                      <Row label="ZIP" value={settings.generateZip ? 'Yes' : 'No'} />
                      <Row label="QR Code" value={settings.generateQrCode ? 'Yes' : 'No'} />
                    </ReviewCard>
                  </div>
                  <ReviewCard title="Recipients">
                    <div className="grid grid-cols-4 gap-3">
                      <Stat label="Total" value={recipients.length} color="text-foreground" />
                      <Stat label="Valid" value={validRecipients.length} color="text-emerald-600" />
                      <Stat label="Invalid" value={validation?.invalid ?? 0} color="text-red-600" />
                      <Stat label="Duplicates" value={validation?.duplicates ?? 0} color="text-amber-600" />
                    </div>
                  </ReviewCard>
                  <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-foreground">Estimated certificates</div>
                        <div className="text-xs text-muted-foreground">{validRecipients.length} PDF files in {settings.paperSize} {settings.orientation}</div>
                      </div>
                      <div className="text-3xl font-bold text-primary">{validRecipients.length}</div>
                    </div>
                  </div>
                  {validRecipients.length === 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4" /> No valid recipients to generate. Go back and fix the data.
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer nav */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <MotionButton variant="outline" size="md" onClick={prev} disabled={step === 1}>
              <ArrowLeft className="h-4 w-4" /> Back
            </MotionButton>
            <div className="text-xs text-muted-foreground">Step {step} of {STEPS.length}</div>
            {step < 7 ? (
              <MotionButton variant="primary" size="md" onClick={next} disabled={!canProceed || (step === 7 && validRecipients.length === 0)}>
                Continue <ArrowRight className="h-4 w-4" />
              </MotionButton>
            ) : (
              <MotionButton variant="success" size="md" onClick={() => setShowConfirm(true)} disabled={validRecipients.length === 0 || submitting} loading={submitting}>
                <Zap className="h-4 w-4" /> Generate Certificates
              </MotionButton>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate certificates?</DialogTitle>
            <DialogDescription>
              You are about to generate <strong className="text-foreground">{validRecipients.length}</strong> certificates for <strong className="text-foreground">{eventInfo.eventName}</strong>.
              The backend will create a job and process all certificates in the background. You'll be redirected to the live progress page.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Event</span><span className="font-medium">{eventInfo.eventName}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Template</span><span className="font-medium">{templates.find((t) => t.id === selectedTemplate)?.name ?? '—'}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Recipients</span><span className="font-medium">{validRecipients.length}</span></div>
            <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Output</span><span className="font-medium">PDF · {settings.paperSize} {settings.orientation}</span></div>
          </div>
          <DialogFooter>
            <MotionButton variant="outline" onClick={() => setShowConfirm(false)}>Cancel</MotionButton>
            <MotionButton variant="success" onClick={generate} loading={submitting}>
              <Zap className="h-4 w-4" /> Confirm & Generate
            </MotionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

function ValidationStep({
  validation,
  recipients,
  onRemoveInvalid,
  onDownloadErrors,
}: {
  validation: ReturnType<typeof validateRecipients> | null
  recipients: RecipientRow[]
  onRemoveInvalid: () => void
  onDownloadErrors: () => void
}) {
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'duplicates'>('all')
  if (!validation) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground">Validation</h2>
        <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">Add recipients first to see validation results.</p>
        </div>
      </div>
    )
  }
  const stats = [
    { label: 'Total records', value: validation.total, color: 'text-foreground', bg: 'bg-slate-50' },
    { label: 'Valid records', value: validation.valid, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Invalid records', value: validation.invalid, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Duplicates', value: validation.duplicates, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Validation</h2>
        <p className="text-sm text-muted-foreground">Review the validation results before continuing.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl border border-border p-3 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30 text-xs">
          {(['all', 'valid', 'invalid', 'duplicates'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('rounded px-2.5 py-1 capitalize', filter === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <MotionButton variant="outline" size="sm" onClick={onDownloadErrors} disabled={validation.invalid + validation.duplicates === 0}>
            <Download className="h-3.5 w-3.5" /> Download Error Report
          </MotionButton>
          <MotionButton variant="outline" size="sm" onClick={onRemoveInvalid} disabled={validation.invalid + validation.duplicates === 0}>
            <Trash2 className="h-3.5 w-3.5" /> Remove Invalid Rows
          </MotionButton>
        </div>
      </div>
      {/* rows */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Department</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Issues</th>
              </tr>
            </thead>
            <tbody>
              {filter === 'all' && recipients.map((r, i) => {
                const inv = validation.invalidRows.find((x) => x.name === r.name && x.email === r.email)
                const dup = validation.duplicateRows.find((x) => x.name === r.name && x.email === r.email)
                const ok = !inv && !dup
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 text-foreground">{r.name || <span className="text-red-500 italic">empty</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.email ?? '—'}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.department ?? '—'}</td>
                    <td className="px-3 py-2">
                      {ok ? <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Valid</span> :
                       inv ? <span className="text-red-600">{inv.issues.map((is) => is.reason).join('; ')}</span> :
                       <span className="text-amber-600">Duplicate</span>}
                    </td>
                  </tr>
                )
              })}
              {filter === 'invalid' && validation.invalidRows.map((r, i) => (
                <tr key={i} className="border-t border-border bg-red-50/30">
                  <td className="px-3 py-2 text-muted-foreground">{validation.validRows.length + i + 1}</td>
                  <td className="px-3 py-2 text-foreground">{r.name || <span className="text-red-500 italic">empty</span>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.department ?? '—'}</td>
                  <td className="px-3 py-2 text-red-600">{r.issues.map((is) => is.reason).join('; ')}</td>
                </tr>
              ))}
              {filter === 'duplicates' && validation.duplicateRows.map((r, i) => (
                <tr key={i} className="border-t border-border bg-amber-50/30">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.department ?? '—'}</td>
                  <td className="px-3 py-2 text-amber-600">Duplicate of row {r.duplicateOf + 1}</td>
                </tr>
              ))}
              {filter === 'valid' && validation.validRows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 text-foreground">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.department ?? '—'}</td>
                  <td className="px-3 py-2"><span className="inline-flex items-center gap-1 text-emerald-600"><Check className="h-3 w-3" /> Valid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {validation.valid === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Cannot continue: zero valid recipients. Please fix the data in step 2.
        </div>
      )}
    </div>
  )
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
