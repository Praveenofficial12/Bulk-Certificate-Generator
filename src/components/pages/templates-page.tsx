'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Eye, Copy, Star, Check } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import type { Template } from '@/lib/types'
import { CertificatePreview } from '@/components/certificate-preview'
import { MotionButton } from '@/components/motion-button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CertificateData, TemplateSlug } from '@/lib/certificate-config'

const SAMPLE_DATA: Partial<CertificateData> = {
  recipientName: 'Recipient Name',
  eventName: 'Sample Event 2026',
  organizationName: 'Your Organization',
  certificateTitle: 'Certificate of Participation',
  certificateId: 'CERT-2026-0001',
  eventDate: 'Jan 15, 2026',
  signatoryName: 'Authorized Signatory',
  signatoryDesignation: 'Designation',
}

export function TemplatesPage() {
  const navigate = useNav((s) => s.navigate)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<Template | null>(null)

  useEffect(() => {
    api.get<Template[]>('/templates').then((t) => {
      setTemplates(t)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function setDefault(t: Template) {
    try {
      // unset others, set this one
      await api.patch(`/templates/${t.id}`, { isDefault: true })
      toast.success(`${t.name} is now the default template`)
      // reload
      const fresh = await api.get<Template[]>('/templates')
      setTemplates(fresh)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Certificate Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose from six professional designs.</p>
        </div>
        <MotionButton variant="primary" size="md" onClick={() => navigate('generate')}>
          <Layers className="h-4 w-4" /> Use a Template
        </MotionButton>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="aspect-[1.414/1] animate-pulse rounded-lg bg-muted" />
                  <div className="mt-4 h-4 w-24 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : templates.map((t, i) => {
              const slug = t.slug as TemplateSlug
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className={cn('overflow-hidden', t.isDefault && 'ring-2 ring-primary')}>
                    <CardContent className="p-3">
                      <CertificatePreview slug={slug} data={SAMPLE_DATA} />
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{t.name}</span>
                            {t.isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                <Star className="h-2.5 w-2.5 fill-current" /> Default
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{t.orientation} · {t.paperSize} · Used {t.usageCount}x</div>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                      <div className="mt-3 flex gap-1.5">
                        <MotionButton variant="primary" size="sm" className="flex-1" onClick={() => navigate('generate')}>
                          <Layers className="h-3.5 w-3.5" /> Use
                        </MotionButton>
                        <MotionButton variant="outline" size="sm" onClick={() => setPreview(t)}>
                          <Eye className="h-3.5 w-3.5" />
                        </MotionButton>
                        {!t.isDefault && (
                          <MotionButton variant="outline" size="sm" onClick={() => setDefault(t)}>
                            <Star className="h-3.5 w-3.5" />
                          </MotionButton>
                        )}
                        {t.isDefault && (
                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
      </div>

      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div>
              <CertificatePreview slug={preview.slug as TemplateSlug} data={SAMPLE_DATA} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Stat label="Orientation" value={preview.orientation} />
                <Stat label="Paper" value={preview.paperSize} />
                <Stat label="Usage" value={`${preview.usageCount} jobs`} />
                <Stat label="Status" value={preview.status} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{preview.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground capitalize">{value}</div>
    </div>
  )
}
