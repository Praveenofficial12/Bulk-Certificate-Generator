'use client'

import { useMemo } from 'react'
import { TEMPLATES_CONFIG, type CertificateData, type TemplateSlug } from '@/lib/certificate-config'
import { cn } from '@/lib/utils'

interface Props {
  slug: TemplateSlug
  data: Partial<CertificateData>
  className?: string
  compact?: boolean
}

export function CertificatePreview({ slug, data, className, compact }: Props) {
  const cfg = TEMPLATES_CONFIG[slug] ?? TEMPLATES_CONFIG['classic-blue']

  const isLandscape = cfg.orientation === 'landscape'
  const aspect = isLandscape ? 'aspect-[1.414/1]' : 'aspect-[1/1.414]'

  const recipientName = data.recipientName || '{{recipient_name}}'
  const eventName = data.eventName || '{{event_name}}'
  const organizationName = data.organizationName || '{{organization_name}}'
  const certificateTitle = (data.certificateTitle || 'Certificate of Participation').toUpperCase()
  const eventDate = data.eventDate || '{{event_date}}'
  const certificateId = data.certificateId || '{{certificate_id}}'
  const signatoryName = data.signatoryName || '{{signatory_name}}'
  const signatoryDesignation = data.signatoryDesignation || '{{signatory_designation}}'
  const orgInitial = (organizationName || 'C').charAt(0).toUpperCase()

  const border = cfg.borderStyle ?? 'double'
  const accent = cfg.accentColor

  const borderClass = useMemo(() => {
    if (border === 'minimal') return 'border-0'
    if (border === 'single') return 'border-2'
    if (border === 'double') return 'border-[3px]'
    return 'border-4' // ornate
  }, [border])

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl bg-white shadow-soft',
        aspect,
        className
      )}
      style={{ borderColor: accent, color: accent }}
    >
      {/* border wrapper */}
      <div className={cn('absolute inset-0', borderClass, 'border-solid rounded-xl')} />

      {/* inner border for double/ornate */}
      {(border === 'double' || border === 'ornate') && (
        <div
          className="absolute inset-2 rounded-lg border"
          style={{ borderColor: accent, borderWidth: border === 'ornate' ? '1px' : '1px' }}
        />
      )}
      {border === 'ornate' && (
        <div className="absolute inset-3 rounded-md border opacity-50" style={{ borderColor: accent }} />
      )}

      {/* corner ornaments */}
      {border === 'ornate' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute h-3 w-3 rounded-sm"
              style={{
                backgroundColor: accent,
                top: i < 2 ? 6 : undefined,
                bottom: i >= 2 ? 6 : undefined,
                left: i % 2 === 0 ? 6 : undefined,
                right: i % 2 === 1 ? 6 : undefined,
              }}
            />
          ))}
        </>
      )}

      {/* watermark */}
      {cfg.showWatermark && (
        <div
          className="absolute inset-0 flex items-center justify-center text-center pointer-events-none select-none"
          style={{ transform: 'rotate(-15deg)' }}
        >
          <span
            className="font-bold uppercase tracking-widest"
            style={{
              color: accent,
              opacity: 0.05,
              fontSize: compact ? '4rem' : '5.5rem',
            }}
          >
            Certificate
          </span>
        </div>
      )}

      {/* top/bottom bars for minimal */}
      {border === 'minimal' && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accent }} />
          <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ backgroundColor: accent }} />
        </>
      )}

      {/* content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-between px-[5%] py-[5%] text-center">
        {/* header */}
        <div className="flex flex-col items-center gap-1">
          {cfg.showLogo && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              {orgInitial}
            </div>
          )}
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            {organizationName}
          </div>
        </div>

        {/* title */}
        <div className="flex flex-col items-center gap-0.5 -mt-1">
          <div
            className="font-serif font-bold leading-tight"
            style={{ color: accent, fontSize: compact ? '1.05rem' : '1.6rem' }}
          >
            {certificateTitle}
          </div>
          <div className="mt-0.5 h-px w-12" style={{ backgroundColor: accent }} />
        </div>

        {/* presented to + recipient */}
        <div className="flex flex-col items-center gap-0.5 -mt-1">
          <div className="text-[8px] italic text-slate-500">
            This certificate is proudly presented to
          </div>
          <div
            className="font-serif font-bold leading-tight"
            style={{ color: '#1a1a2e', fontSize: compact ? '1rem' : '1.5rem' }}
          >
            {recipientName}
          </div>
          <div className="h-px w-3/4" style={{ backgroundColor: accent, opacity: 0.5 }} />
        </div>

        {/* achievement + event */}
        <div className="flex flex-col items-center gap-0.5 -mt-1">
          <div className="text-[8px] italic text-slate-500">
            for successfully participating in
          </div>
          <div className="text-[11px] font-bold text-slate-800">{eventName}</div>
          <div className="text-[8px] text-slate-500">organized by {organizationName}</div>
          {data.department && (
            <div className="text-[8px] text-slate-500">Department: {data.department}</div>
          )}
        </div>

        {/* footer */}
        <div className="flex w-full items-end justify-between">
          {/* signature */}
          <div className="flex flex-col items-center">
            <div className="text-[7px] italic text-slate-400 mb-1">Authorized Signature</div>
            <div className="h-px w-20" style={{ backgroundColor: '#666' }} />
            <div className="mt-1 text-[9px] font-bold text-slate-800">{signatoryName}</div>
            <div className="text-[7px] text-slate-500">{signatoryDesignation}</div>
          </div>

          {/* seal */}
          {cfg.showSeal && (
            <div className="relative flex items-center justify-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-[6px] font-bold text-white"
                style={{ backgroundColor: '#b8860b' }}
              >
                <div className="absolute inset-0 rounded-full border border-amber-700" />
                <div className="flex flex-col items-center leading-none">
                  <span>OFFICIAL</span>
                  <span className="mt-0.5">SEAL</span>
                </div>
              </div>
            </div>
          )}

          {/* cert id + date */}
          <div className="flex flex-col items-center">
            <div className="h-px w-20" style={{ backgroundColor: '#666' }} />
            <div className="mt-1 text-[8px] font-bold" style={{ color: accent }}>
              {certificateId}
            </div>
            <div className="text-[7px] text-slate-500">Date: {eventDate}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
