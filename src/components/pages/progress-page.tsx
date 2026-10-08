'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  AlertTriangle,
  X,
  FileCheck2,
  RefreshCw,
  Eye,
  XCircle,
  PartyPopper,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import type { GenerationJob } from '@/lib/types'
import { MotionButton } from '@/components/motion-button'
import { StatusBadge } from '@/components/status-badge'
import { toast } from 'sonner'
import { downloadBlob } from '@/lib/format'
import { cn } from '@/lib/utils'

export function ProgressPage() {
  const { params, navigate } = useNav()
  const jobId = params.jobId
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [retaking, setRetaking] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!jobId) {
      navigate('jobs')
      return
    }
    let active = true
    const poll = async () => {
      try {
        const res = await api.get<any>(`/generation/jobs/${jobId}/status`)
        if (!active) return
        setJob(res)
        setRecent(res.recent ?? [])
        setLoading(false)
        if (res.status === 'COMPLETED' || res.status === 'FAILED' || res.status === 'PARTIALLY_COMPLETED' || res.status === 'CANCELLED') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      } catch (e: any) {
        if (!active) return
        toast.error(e?.message ?? 'Failed to fetch job status')
        setLoading(false)
      }
    }
    poll()
    intervalRef.current = setInterval(poll, 1200)
    return () => {
      active = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId, navigate])

  async function cancel() {
    if (!job) return
    setCancelling(true)
    try {
      await api.post(`/generation/jobs/${job.id}/cancel`)
      toast.success('Job cancellation requested')
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  async function downloadZip() {
    if (!job) return
    setDownloadingZip(true)
    try {
      const blob = await api.blob(`/certificates/bulk-download/${job.id}`)
      downloadBlob(blob, `${job.jobId}.zip`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Download failed')
    } finally {
      setDownloadingZip(false)
    }
  }

  async function downloadReport() {
    if (!job) return
    setDownloadingReport(true)
    try {
      const blob = await api.blob(`/generation/jobs/${job.id}/download`)
      downloadBlob(blob, `${job.jobId}.zip`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Download failed')
    } finally {
      setDownloadingReport(false)
    }
  }

  async function retryFailed() {
    if (!job) return
    setRetaking(true)
    try {
      const res = await api.post<{ id: string; jobId: string }>(`/generation/jobs/${job.id}/retry`)
      toast.success(`Retry job ${res.jobId} created`)
      navigate('progress', { jobId: res.id })
    } catch (e: any) {
      toast.error(e?.message ?? 'Retry failed')
    } finally {
      setRetaking(false)
    }
  }

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isProcessing = job.status === 'PROCESSING' || job.status === 'PENDING'
  const isComplete = job.status === 'COMPLETED'
  const isPartial = job.status === 'PARTIALLY_COMPLETED'
  const isFailed = job.status === 'FAILED'
  const isCancelled = job.status === 'CANCELLED'
  const remaining = job.totalRecipients - job.processedCount

  const stats = [
    { label: 'Total', value: job.totalRecipients, color: 'text-foreground' },
    { label: 'Processed', value: job.processedCount, color: 'text-blue-600' },
    { label: 'Successful', value: job.successfulCount, color: 'text-emerald-600' },
    { label: 'Failed', value: job.failedCount, color: 'text-red-600' },
    { label: 'Remaining', value: Math.max(0, remaining), color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('jobs')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>
        <StatusBadge status={job.status} />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 shadow-soft text-center"
      >
        {isProcessing && (
          <div>
            <div className="relative mx-auto mb-6 h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <motion.circle
                  cx="64" cy="64" r="56" fill="none" stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 56}
                  animate={{ strokeDashoffset: 2 * Math.PI * 56 - (2 * Math.PI * 56 * job.progressPercentage) / 100 }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={job.progressPercentage}
                  initial={{ scale: 0.9, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-bold text-foreground"
                >
                  {job.progressPercentage}%
                </motion.div>
                <div className="text-xs text-muted-foreground">complete</div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Generating your certificates...</h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.eventName}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <MotionButton variant="outline" size="md" onClick={() => navigate('jobs')}>
                <Eye className="h-4 w-4" /> View Details
              </MotionButton>
              <MotionButton variant="destructive" size="md" onClick={cancel} loading={cancelling}>
                <X className="h-4 w-4" /> Cancel Job
              </MotionButton>
            </div>
          </div>
        )}

        {(isComplete || isPartial) && (
          <div>
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            >
              <PartyPopper className="h-8 w-8" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">
              {isComplete ? 'Generation Complete!' : 'Generation completed with some errors'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isComplete
                ? `${job.successfulCount} certificates generated successfully.`
                : `${job.successfulCount} succeeded, ${job.failedCount} failed.`}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {job.outputZipPath && (
                <MotionButton variant="primary" size="md" onClick={downloadZip} loading={downloadingZip}>
                  <Download className="h-4 w-4" /> Download All ZIP
                </MotionButton>
              )}
              <MotionButton variant="outline" size="md" onClick={() => navigate('certificates')}>
                <FileCheck2 className="h-4 w-4" /> View Certificates
              </MotionButton>
              {isPartial && (
                <MotionButton variant="outline" size="md" onClick={retryFailed} loading={retaking}>
                  <RefreshCw className="h-4 w-4" /> Retry Failed
                </MotionButton>
              )}
            </div>
          </div>
        )}

        {isFailed && (
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"
            >
              <AlertTriangle className="h-8 w-8" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">Generation Failed</h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.errorMessage ?? 'An unexpected error occurred.'}</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <MotionButton variant="primary" size="md" onClick={retryFailed} loading={retaking}>
                <RefreshCw className="h-4 w-4" /> Retry Job
              </MotionButton>
              <MotionButton variant="outline" size="md" onClick={() => navigate('generate')}>
                Start New
              </MotionButton>
            </div>
          </div>
        )}

        {isCancelled && (
          <div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-600"
            >
              <XCircle className="h-8 w-8" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground">Job Cancelled</h2>
            <p className="mt-1 text-sm text-muted-foreground">{job.successfulCount} certificates were generated before cancellation.</p>
            <div className="mt-6">
              <MotionButton variant="primary" size="md" onClick={() => navigate('generate')}>
                Start New
              </MotionButton>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3 text-center"
          >
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Progress</span>
          <span className="text-muted-foreground">{job.processedCount} / {job.totalRecipients}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
            animate={{ width: `${job.progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Live feed */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">Live generation feed</div>
          {isProcessing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
              <span className="flex h-2 w-2">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              </span>
              live
            </span>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto scrollbar-thin p-2">
          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="space-y-1">
              {recent.map((c, i) => (
                <motion.div
                  key={c.certificateId + i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                    c.status === 'GENERATED' ? 'bg-emerald-50/50' : 'bg-red-50/50'
                  )}
                >
                  {c.status === 'GENERATED' ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
                  )}
                  <span className="flex-1 text-foreground">{c.recipientName}</span>
                  {c.status === 'GENERATED' ? (
                    <span className="text-xs text-emerald-600">generated</span>
                  ) : (
                    <span className="text-xs text-red-600">failed: {c.errorMessage}</span>
                  )}
                  {c.certificateId && (
                    <span className="text-xs font-mono text-primary">{c.certificateId}</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
