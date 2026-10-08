'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Eye,
  ExternalLink,
  LayoutGrid,
  List as ListIcon,
  Search,
  Trash2,
  FileCheck2,
  Copy,
  X,
  ShieldCheck,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import type { Certificate, Paginated } from '@/lib/types'
import { MotionButton } from '@/components/motion-button'
import { StatusBadge } from '@/components/status-badge'
import { TableEmpty } from '@/components/empty-state'
import { CertificatePreview } from '@/components/certificate-preview'
import { toast } from 'sonner'
import { formatDate, formatRelative, downloadBlob, downloadUrl, debounce } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { TemplateSlug } from '@/lib/certificate-config'

export function CertificatesPage() {
  const { params, navigate } = useNav()
  const [data, setData] = useState<Paginated<Certificate> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(params.search ?? '')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [preview, setPreview] = useState<Certificate | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const load = useCallback(debounce((s: string, st: string, p: number) => {
    setLoading(true)
    const q = new URLSearchParams({ search: s, page: String(p), pageSize: '12' })
    if (st !== 'All') q.set('status', st)
    api.get<Paginated<Certificate>>(`/certificates?${q}`).then((r) => {
      setData(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, 350), [])

  useEffect(() => { load(search, statusFilter, page) }, [search, statusFilter, page, load])

  async function download(cert: Certificate) {
    setDownloading(cert.id)
    try {
      const blob = await api.blob(`/certificates/${cert.id}/download`)
      downloadBlob(blob, cert.fileName)
    } catch (e: any) {
      toast.error(e?.message ?? 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

  async function verify(cert: Certificate) {
    navigate('verify', { id: cert.verificationToken })
  }

  async function copyLink(cert: Certificate) {
    const url = `${window.location.origin}/?verify=${cert.verificationToken}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Verification link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  async function del(cert: Certificate) {
    if (!confirm(`Delete certificate ${cert.certificateId}?`)) return
    try {
      await api.del(`/certificates/${cert.id}`)
      toast.success('Certificate deleted')
      load(search, statusFilter, page)
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Browse, preview, download, and verify generated certificates.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1 bg-muted/30">
          <button onClick={() => setView('table')} className={cn('inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs', view === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
            <ListIcon className="h-3.5 w-3.5" /> Table
          </button>
          <button onClick={() => setView('cards')} className={cn('inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs', view === 'cards' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
            <LayoutGrid className="h-3.5 w-3.5" /> Cards
          </button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search certificate ID, name, email..." className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All status</SelectItem>
                  <SelectItem value="GENERATED">Generated</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {view === 'table' ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Certificate ID</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Recipient</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Event</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Department</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Generated</th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-border"><td colSpan={7} className="px-3 py-3"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((c) => (
                      <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                        <td className="px-3 py-2.5 font-mono text-xs text-primary">{c.certificateId}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">{c.recipientName}</div>
                          <div className="text-[10px] text-muted-foreground">{c.recipientEmail ?? '—'}</div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{c.eventName}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{c.department ?? '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatRelative(c.generatedAt)}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex gap-0.5">
                            <IconAction title="Preview" onClick={() => setPreview(c)}><Eye className="h-3.5 w-3.5" /></IconAction>
                            {c.status === 'GENERATED' && (
                              <IconAction title="Download" onClick={() => download(c)}><Download className="h-3.5 w-3.5" /></IconAction>
                            )}
                            <IconAction title="Verify" onClick={() => verify(c)}><ShieldCheck className="h-3.5 w-3.5" /></IconAction>
                            <IconAction title="Copy verification link" onClick={() => copyLink(c)}><Copy className="h-3.5 w-3.5" /></IconAction>
                            <IconAction title="Delete" onClick={() => del(c)} destructive><Trash2 className="h-3.5 w-3.5" /></IconAction>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <TableEmpty message="No certificates found." />
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[1.414/1] animate-pulse rounded-lg bg-muted" />
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
                    <CertificatePreview
                      slug={(c.template?.slug ?? 'classic-blue') as TemplateSlug}
                      data={{
                        recipientName: c.recipientName,
                        eventName: c.eventName,
                        organizationName: c.organizationName,
                        certificateTitle: c.certificateTitle,
                        eventDate: c.eventDate ?? undefined,
                        certificateId: c.certificateId,
                        department: c.department ?? undefined,
                        signatoryName: c.signatoryName ?? undefined,
                        signatoryDesignation: c.signatoryDesignation ?? undefined,
                      }}
                      templateOverride={c.template?.backgroundImage || c.template?.isCustom ? {
                        templateId: c.template!.id,
                        backgroundImage: c.template!.backgroundImage,
                        isCustom: true,
                        accentColor: c.template!.accentColor,
                        orientation: c.template!.orientation as 'landscape' | 'portrait',
                        paperSize: c.template!.paperSize as 'A4' | 'Letter',
                      } : undefined}
                    />
                    <div className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{c.recipientName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{c.certificateId}</div>
                      </div>
                      <div className="inline-flex gap-0.5">
                        <IconAction title="Preview" onClick={() => setPreview(c)}><Eye className="h-3.5 w-3.5" /></IconAction>
                        {c.status === 'GENERATED' && (
                          <IconAction title="Download" onClick={() => download(c)} loading={downloading === c.id}><Download className="h-3.5 w-3.5" /></IconAction>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full"><TableEmpty message="No certificates found." /></div>
              )}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Showing {(data.page - 1) * 12 + 1}–{Math.min(data.page * 12, data.total)} of {data.total}</div>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">‹</button>
                <span className="inline-flex h-8 items-center px-2 text-muted-foreground">{page} / {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
            <DialogDescription>{preview?.certificateId}</DialogDescription>
          </DialogHeader>
          {preview && (
            <div>
              <div className="mx-auto max-w-2xl">
                <CertificatePreview
                  slug={(preview.template?.slug ?? 'classic-blue') as TemplateSlug}
                  data={{
                    recipientName: preview.recipientName,
                    eventName: preview.eventName,
                    organizationName: preview.organizationName,
                    certificateTitle: preview.certificateTitle,
                    eventDate: preview.eventDate ?? undefined,
                    certificateId: preview.certificateId,
                    department: preview.department ?? undefined,
                    signatoryName: preview.signatoryName ?? undefined,
                    signatoryDesignation: preview.signatoryDesignation ?? undefined,
                  }}
                  templateOverride={preview.template?.backgroundImage || preview.template?.isCustom ? {
                    templateId: preview.template!.id,
                    backgroundImage: preview.template!.backgroundImage,
                    isCustom: true,
                    accentColor: preview.template!.accentColor,
                    orientation: preview.template!.orientation as 'landscape' | 'portrait',
                    paperSize: preview.template!.paperSize as 'A4' | 'Letter',
                  } : undefined}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Detail label="Recipient" value={preview.recipientName} />
                <Detail label="Email" value={preview.recipientEmail ?? '—'} />
                <Detail label="Event" value={preview.eventName} />
                <Detail label="Department" value={preview.department ?? '—'} />
                <Detail label="Issued" value={formatDate(preview.generatedAt)} />
                <Detail label="Template" value={preview.template?.name ?? '—'} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <MotionButton variant="outline" size="sm" onClick={() => copyLink(preview)}>
                  <Copy className="h-3.5 w-3.5" /> Copy Verification Link
                </MotionButton>
                <MotionButton variant="outline" size="sm" onClick={() => verify(preview)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify
                </MotionButton>
                {preview.status === 'GENERATED' && (
                  <MotionButton variant="primary" size="sm" onClick={() => download(preview)} loading={downloading === preview.id}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </MotionButton>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground truncate">{value}</div>
    </div>
  )
}

function IconAction({ children, onClick, title, destructive, loading }: { children: React.ReactNode; onClick: () => void; title: string; destructive?: boolean; loading?: boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={loading} className={cn('inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50', destructive && 'hover:bg-red-50 hover:text-red-600')}>
      {children}
    </button>
  )
}
