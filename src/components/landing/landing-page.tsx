'use client'

import { motion } from 'framer-motion'
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  Mail,
  Menu,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Zap,
  ArrowRight,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { useNav } from '@/lib/nav-store'
import { MotionButton } from '@/components/motion-button'
import { CertificatePreview } from '@/components/certificate-preview'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

const TRUSTED_USE_CASES = [
  { icon: Award, label: 'Colleges & Universities' },
  { icon: Users, label: 'Schools' },
  { icon: FileSpreadsheet, label: 'Companies' },
  { icon: Sparkles, label: 'Event Organizers' },
  { icon: Layers, label: 'Training Institutes' },
  { icon: Zap, label: 'Hackathons' },
  { icon: Mail, label: 'Webinars' },
  { icon: ShieldCheck, label: 'Internships' },
]

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: 'Upload Recipients',
    desc: 'Upload a CSV or Excel file with hundreds of recipient records. Map columns to certificate fields automatically.',
  },
  {
    icon: CheckCircle2,
    title: 'Validate Data',
    desc: 'Get instant validation: invalid emails, missing names, and duplicates are flagged for review.',
  },
  {
    icon: Zap,
    title: 'Generate Certificates',
    desc: 'Submit one bulk request. The engine generates professional PDFs in the background with live progress.',
  },
  {
    icon: Download,
    title: 'Download & Share',
    desc: 'Download individual PDFs or all certificates as a ZIP. Share secure verification links.',
  },
]

const FEATURES = [
  {
    icon: Layers,
    title: 'Bulk Generation',
    desc: 'Generate hundreds of certificates with a single request — never one API call per certificate.',
  },
  {
    icon: ShieldCheck,
    title: 'Verification System',
    desc: 'Every certificate has a unique verification token and QR code for instant authenticity checks.',
  },
  {
    icon: Clock,
    title: 'Real-time Progress',
    desc: 'Track generation progress live with per-recipient success and failure feed.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Visualize trends, success rates, template usage, and top events.',
  },
  {
    icon: Users,
    title: 'Recipient Management',
    desc: 'Import, edit, search, and manage your recipient library with bulk operations.',
  },
  {
    icon: Download,
    title: 'ZIP & Reports',
    desc: 'Download all certificates as a ZIP with an included CSV generation report.',
  },
]

const FAQ = [
  {
    q: 'How does bulk generation work?',
    a: 'You submit a single API request containing the event details and a list of recipients. The backend creates a generation job, returns a job ID immediately, and processes every certificate asynchronously in the background. The frontend polls for live progress updates.',
  },
  {
    q: 'What file formats are supported for recipient uploads?',
    a: 'CSV (.csv) and Excel (.xlsx, .xls). Dangerous file types like .exe, .js, .html, .sh, .php are rejected. Files must be under 5MB.',
  },
  {
    q: 'Can I customize the certificate template?',
    a: 'Yes. The app ships with six predefined professional templates (Classic Blue, Elegant Gold, Modern Minimal, Academic, Corporate, Event Celebration). The architecture supports adding more templates easily.',
  },
  {
    q: 'How is certificate authenticity verified?',
    a: 'Every generated certificate gets a unique certificate ID and a verification token. A public verification URL displays the certificate details with a green "verified" badge. A QR code on each certificate links to this verification page.',
  },
  {
    q: 'What happens if some recipients fail to generate?',
    a: 'Individual failures are recorded without crashing the whole job. The job completes as "Partially Completed" and you can retry the failed recipients with one click, or download an error report.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. Passwords are hashed with bcrypt, JWT authentication protects routes, role-based authorization separates Admin and Staff permissions, file uploads are validated, and safe filenames prevent path traversal.',
  },
]

export function LandingPage() {
  const navigate = useNav((s) => s.navigate)
  const [mobileMenu, setMobileMenu] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Award className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-foreground">Bulk Certificate</span>
              <span className="text-[10px] font-medium text-muted-foreground">Generator</span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <MotionButton variant="ghost" size="md" onClick={() => navigate('login')}>
              Sign in
            </MotionButton>
            <MotionButton variant="primary" size="md" onClick={() => navigate('login')}>
              Get Started
              <ArrowRight className="h-4 w-4" />
            </MotionButton>
          </div>
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground"
            onClick={() => setMobileMenu((v) => !v)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
            <MotionButton variant="ghost" size="md" className="w-full" onClick={() => navigate('login')}>Sign in</MotionButton>
            <MotionButton variant="primary" size="md" className="w-full" onClick={() => navigate('login')}>Get Started</MotionButton>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              {/* Left: copy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-start gap-6"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trusted by universities & event organizers
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Generate Hundreds of{' '}
                  <span className="gradient-text">Certificates</span>{' '}
                  In Minutes.
                </h1>
                <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                  Create, process, track, and download bulk certificates with a simple and powerful certificate generation platform.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <MotionButton variant="primary" size="lg" onClick={() => navigate('login')}>
                    Start Generating
                    <ArrowRight className="h-4 w-4" />
                  </MotionButton>
                  <MotionButton variant="outline" size="lg" onClick={() => {
                    const el = document.getElementById('features')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}>
                    Explore Features
                  </MotionButton>
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <div>
                    <div className="text-2xl font-bold text-foreground">10K+</div>
                    <div className="text-xs text-muted-foreground">Certificates generated</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-foreground">6</div>
                    <div className="text-xs text-muted-foreground">Premium templates</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-foreground">99.4%</div>
                    <div className="text-xs text-muted-foreground">Success rate</div>
                  </div>
                </div>
              </motion.div>

              {/* Right: dashboard mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                {/* Floating certificate cards */}
                <motion.div
                  className="absolute -left-6 top-10 z-20 hidden w-48 rotate-[-6deg] sm:block"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CertificatePreview slug="classic-blue" data={{ recipientName: 'Priya Kumar', eventName: 'AI Workshop', organizationName: 'V.S.B College', certificateTitle: 'Certificate of Participation', certificateId: 'VSB-AI-2026-0042', eventDate: 'Jan 15, 2026', signatoryName: 'Dr. Krishnan', signatoryDesignation: 'Dean' }} compact />
                </motion.div>
                <motion.div
                  className="absolute -right-6 bottom-10 z-20 hidden w-44 rotate-[5deg] sm:block"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <CertificatePreview slug="elegant-gold" data={{ recipientName: 'Carlos Rivera', eventName: 'Hackathon', organizationName: 'V.S.B College', certificateTitle: 'Certificate of Achievement', certificateId: 'VSB-HK-2026-0118', eventDate: 'Feb 20, 2026', signatoryName: 'Dr. Anitha', signatoryDesignation: 'HoD CSE' }} compact />
                </motion.div>

                {/* Dashboard preview */}
                <div className="relative z-10 rounded-2xl border border-border bg-card p-5 shadow-glow">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-foreground">Generation Progress</div>
                      <div className="text-xs text-muted-foreground">AI & Innovation Workshop 2026</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Processing
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { label: 'Recipients', value: '500', icon: Users, color: 'text-blue-600' },
                      { label: 'Completed', value: '335', icon: CheckCircle2, color: 'text-emerald-600' },
                      { label: 'Failed', value: '5', icon: ShieldCheck, color: 'text-red-600' },
                      { label: 'Progress', value: '68%', icon: BarChart3, color: 'text-primary' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-border bg-background/50 p-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <s.icon className={cn('h-3 w-3', s.color)} />
                          {s.label}
                        </div>
                        <div className="text-base font-bold text-foreground">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* progress bar */}
                  <div className="mb-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '68%' }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* recent feed */}
                  <div className="space-y-1.5">
                    {[
                      { name: 'Priya Kumar', status: 'ok' },
                      { name: 'Mei Chen', status: 'ok' },
                      { name: 'Alex Smith', status: 'fail' },
                    ].map((r) => (
                      <div key={r.name} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                        <span className="text-foreground">{r.name}</span>
                        {r.status === 'ok' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-red-600 text-[10px]">failed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trusted use cases */}
        <section className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Built for every kind of certificate workflow
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {TRUSTED_USE_CASES.map((u, i) => (
                <motion.div
                  key={u.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border">
                    <u.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{u.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-3 text-muted-foreground">
                From recipient list to downloadable certificates in four simple steps.
              </p>
            </div>
            <div className="relative">
              {/* connecting line */}
              <div className="absolute top-12 left-0 right-0 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />
              <div className="grid gap-8 lg:grid-cols-4">
                {HOW_IT_WORKS.map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="relative flex flex-col items-center text-center"
                  >
                    <div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
                      <step.icon className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything you need
              </h2>
              <p className="mt-3 text-muted-foreground">
                A complete platform for managing certificates at scale.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bulk processing explanation */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
                  <Layers className="h-3.5 w-3.5" />
                  Built for scale
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  One request. Hundreds of certificates.
                </h2>
                <p className="mt-4 text-muted-foreground">
                  The Bulk Certificate Generator is architected around a single bulk generation request. Submit one API call with your event details and a list of recipients — the engine creates a job, returns a unique job ID immediately, and processes every certificate asynchronously in the background.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Validate recipient data before generation (missing names, invalid emails, duplicates)',
                    'Generate one PDF per valid recipient with a unique certificate ID and QR code',
                    'Track progress live — successful and failed recipients stream in real time',
                    'Download all certificates as a ZIP with an included generation report',
                    'Retry only the failed recipients without regenerating successful ones',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs text-muted-foreground">POST /api/generation/jobs</span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
{`{
  "event_name": "AI Workshop 2026",
  "organization_name": "V.S.B College",
  "certificate_title": "Certificate of Participation",
  "template_id": 1,
  "recipients": [
    { "name": "John Doe", "email": "john@x.com" },
    { "name": "Priya Kumar", "email": "priya@x.com" }
  ],
  "settings": {
    "paper_size": "A4",
    "orientation": "landscape",
    "certificate_id_prefix": "VSB-AI-2026"
  }
}`}
                  </pre>
                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Returns job ID immediately
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                      <Loader2 className="h-3 w-3" /> Processes in background
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certificate preview */}
        <section className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Six premium templates</h2>
              <p className="mt-3 text-muted-foreground">Professional designs for every occasion.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { slug: 'classic-blue' as const, name: 'Classic Blue' },
                { slug: 'elegant-gold' as const, name: 'Elegant Gold' },
                { slug: 'modern-minimal' as const, name: 'Modern Minimal' },
                { slug: 'academic' as const, name: 'Academic' },
                { slug: 'corporate' as const, name: 'Corporate' },
                { slug: 'event-celebration' as const, name: 'Event Celebration' },
              ].map((t) => (
                <div key={t.slug} className="flex flex-col gap-3">
                  <CertificatePreview
                    slug={t.slug}
                    data={{
                      recipientName: 'Recipient Name',
                      eventName: 'Sample Event',
                      organizationName: 'Your Organization',
                      certificateTitle: t.name,
                      certificateId: 'CERT-2026-0001',
                      eventDate: 'Jan 15, 2026',
                      signatoryName: 'Authorized Signatory',
                      signatoryDesignation: 'Designation',
                    }}
                  />
                  <div className="text-center text-sm font-medium text-foreground">{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Certificates Generated</div>
                      <div className="text-xs text-muted-foreground">Last 14 days</div>
                    </div>
                  </div>
                  <div className="flex h-40 items-end gap-1.5">
                    {Array.from({ length: 14 }).map((_, i) => {
                      const h = 20 + Math.round(Math.abs(Math.sin(i * 0.7)) * 80)
                      return (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: i * 0.04 }}
                          className="flex-1 rounded-t bg-gradient-to-t from-primary/30 to-primary"
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Understand your certificate operations
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Visualize trends in certificate generation, success and failure rates, template usage, top events, and average generation time. Filter by day, week, month, or custom range.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="border-t border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Security
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Secure by design
                </h2>
                <p className="mt-4 text-muted-foreground">
                  JWT authentication, hashed passwords, role-based authorization, file validation, and safe filenames protect your data and your users.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'JWT-based authentication with role-based access (Admin, Staff)',
                    'Password hashing with bcrypt',
                    'File type validation — dangerous file types are rejected',
                    'Safe filename generation prevents path traversal',
                    'Public certificate verification with unique tokens',
                    'Structured API errors with human-readable messages',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-sm text-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: ShieldCheck, label: 'Auth', value: 'JWT + bcrypt' },
                  { icon: Layers, label: 'Roles', value: 'Admin / Staff' },
                  { icon: CheckCircle2, label: 'Validation', value: 'Files & data' },
                  { icon: Download, label: 'Downloads', value: 'Path-safe' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                    <s.icon className="h-6 w-6 text-primary" />
                    <div className="mt-3 text-xs text-muted-foreground">{s.label}</div>
                    <div className="text-sm font-semibold text-foreground">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Frequently asked questions</h2>
              <p className="mt-3 text-muted-foreground">Everything you need to know about the platform.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base font-medium text-foreground">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border bg-gradient-to-br from-primary to-blue-700 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to generate your first batch?
            </h2>
            <p className="mt-4 text-base text-white/80">
              Sign in with the demo account and try the full workflow in under two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MotionButton
                variant="secondary"
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => navigate('login')}
              >
                Start Generating
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1 text-white/80">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
              <span className="ml-2 text-xs">Loved by educators and event organizers</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Award className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-foreground">Bulk Certificate Generator</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Create, manage and deliver hundreds of certificates in minutes.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#how" className="hover:text-foreground">How it works</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Use cases</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Universities</li>
                <li>Corporate training</li>
                <li>Hackathons</li>
                <li>Workshops</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-foreground" onClick={() => navigate('login')}>Sign in</button></li>
                <li><button className="hover:text-foreground" onClick={() => navigate('register')}>Create account</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bulk Certificate Generator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
