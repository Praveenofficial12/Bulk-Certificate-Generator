'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Award,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Calendar,
  Building2,
  User as UserIcon,
  FileCheck2,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import { CertificatePreview } from '@/components/certificate-preview'
import { MotionButton } from '@/components/motion-button'
import { formatDate } from '@/lib/format'
import type { CertificateData, TemplateSlug } from '@/lib/certificate-config'

interface VerifyData {
  certificateId: string
  recipientName: string
  eventName: string
  organizationName: string
  certificateTitle: string
  eventDate: string | null
  issuedDate: string
  status: string
  verifiedAt: string
  template?: { name: string; slug: string } | null
}

export function VerifyPage() {
  const { params, navigate } = useNav()
  const token = params.id
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('No verification token provided.')
      setLoading(false)
      return
    }
    api.get<VerifyData>(`/certificates/verify/${token}`)
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch((e) => {
        setError(e?.message ?? 'Certificate not found.')
        setLoading(false)
      })
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">Verifying certificate...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <header className="border-b border-border bg-background">
          <div className="mx-auto max-w-5xl px-4 h-16 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Award className="h-4 w-4" /></div>
            <span className="text-sm font-bold">Bulk Certificate Generator</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Certificate Not Found or Invalid</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <p className="mt-1 text-xs text-muted-foreground">The verification token may be incorrect or the certificate has been removed.</p>
            <MotionButton variant="primary" size="md" className="mt-6" onClick={() => navigate('landing')}>
              <ArrowLeft className="h-4 w-4" /> Go Home
            </MotionButton>
          </motion.div>
        </main>
      </div>
    )
  }

  const previewData: Partial<CertificateData> = {
    recipientName: data.recipientName,
    eventName: data.eventName,
    organizationName: data.organizationName,
    certificateTitle: data.certificateTitle,
    eventDate: data.eventDate ?? undefined,
    certificateId: data.certificateId,
    signatoryName: 'Authorized Signatory',
    signatoryDesignation: 'Designation',
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Award className="h-4 w-4" /></div>
            <span className="text-sm font-bold">Bulk Certificate Generator</span>
          </button>
          <MotionButton variant="outline" size="sm" onClick={() => navigate('login')}>
            Sign in
          </MotionButton>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-10">
        {/* verified badge */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex flex-col items-center text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-emerald-400/20 blur-xl" />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-10 w-10" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Certificate Verified</h1>
          <p className="mt-1 text-sm text-muted-foreground">This certificate is authentic and has been verified.</p>
        </motion.div>

        {/* Certificate preview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <CertificatePreview slug={(data.template?.slug ?? 'classic-blue') as TemplateSlug} data={previewData} />
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail icon={UserIcon} label="Recipient Name" value={data.recipientName} />
            <Detail icon={FileCheck2} label="Certificate ID" value={data.certificateId} />
            <Detail icon={Award} label="Certificate Title" value={data.certificateTitle} />
            <Detail icon={Calendar} label="Event Date" value={data.eventDate ?? '—'} />
            <Detail icon={Building2} label="Organization" value={data.organizationName} />
            <Detail icon={Award} label="Event" value={data.eventName} />
            <Detail icon={Calendar} label="Issued Date" value={formatDate(data.issuedDate, true)} />
            <Detail icon={CheckCircle2} label="Status" value={data.status} />
          </div>
          <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Verified on {formatDate(data.verifiedAt, true)}</span>
            </div>
            <div className="mt-1 text-xs text-emerald-600">
              This certificate was generated by Bulk Certificate Generator and bears a unique verification token. You can trust its authenticity.
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Bulk Certificate Generator · Secure verification powered by unique tokens
        </div>
      </footer>
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground break-words">{value}</div>
      </div>
    </div>
  )
}
