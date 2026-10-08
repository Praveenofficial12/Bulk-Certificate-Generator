'use client'

import { motion } from 'framer-motion'
import {
  Award,
  ArrowLeft,
  BookOpen,
  Zap,
  Upload,
  CheckCircle2,
  Download,
  ShieldCheck,
  Code2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { MotionButton } from '@/components/motion-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WORKFLOW = [
  { step: 1, title: 'Sign in', desc: 'Login with the demo admin account.', icon: Award },
  { step: 2, title: 'Open Generate', desc: 'Navigate to Generate Certificates.', icon: Zap },
  { step: 3, title: 'Enter event info', desc: 'Fill in event name, organization, signatory.', icon: BookOpen },
  { step: 4, title: 'Upload recipients', desc: 'Upload a CSV/Excel file or add manually.', icon: Upload },
  { step: 5, title: 'Validate', desc: 'Review valid, invalid, and duplicate rows.', icon: CheckCircle2 },
  { step: 6, title: 'Select template', desc: 'Pick from 6 professional templates.', icon: Award },
  { step: 7, title: 'Preview', desc: 'See how certificates will look.', icon: CheckCircle2 },
  { step: 8, title: 'Configure settings', desc: 'Paper, orientation, ZIP, QR.', icon: ShieldCheck },
  { step: 9, title: 'Review & Generate', desc: 'Confirm and submit one bulk request.', icon: Zap },
  { step: 10, title: 'Watch progress', desc: 'Track generation live.', icon: Zap },
  { step: 11, title: 'Download ZIP', desc: 'Get all certificates as a ZIP.', icon: Download },
  { step: 12, title: 'Verify', desc: 'Open the verification URL.', icon: ShieldCheck },
]

const ENDPOINTS = [
  { method: 'POST', path: '/api/auth/login', desc: 'Authenticate and get JWT token' },
  { method: 'POST', path: '/api/auth/register', desc: 'Create a new user account' },
  { method: 'GET', path: '/api/auth/me', desc: 'Get the current authenticated user' },
  { method: 'GET', path: '/api/templates', desc: 'List all certificate templates' },
  { method: 'POST', path: '/api/templates', desc: 'Create a new template (admin)' },
  { method: 'GET', path: '/api/recipients', desc: 'List recipients (paginated, searchable)' },
  { method: 'POST', path: '/api/recipients', desc: 'Add a single recipient' },
  { method: 'POST', path: '/api/recipients/upload', desc: 'Upload & parse CSV/Excel' },
  { method: 'POST', path: '/api/recipients/bulk', desc: 'Bulk create recipients' },
  { method: 'POST', path: '/api/generation/jobs', desc: '★ Bulk generation request — returns job ID immediately' },
  { method: 'GET', path: '/api/generation/jobs', desc: 'List all generation jobs' },
  { method: 'GET', path: '/api/generation/jobs/{job_id}/status', desc: 'Poll live progress for a job' },
  { method: 'GET', path: '/api/generation/jobs/{job_id}/certificates', desc: 'List certificates for a job' },
  { method: 'POST', path: '/api/generation/jobs/{job_id}/cancel', desc: 'Cancel a running job' },
  { method: 'POST', path: '/api/generation/jobs/{job_id}/retry', desc: 'Retry failed certificates' },
  { method: 'GET', path: '/api/certificates', desc: 'List all certificates' },
  { method: 'GET', path: '/api/certificates/{id}/download', desc: 'Download an individual PDF' },
  { method: 'GET', path: '/api/certificates/bulk-download/{job_id}', desc: 'Download all certificates as ZIP' },
  { method: 'GET', path: '/api/certificates/verify/{token}', desc: 'Public certificate verification' },
  { method: 'GET', path: '/api/analytics/overview', desc: 'Dashboard metrics' },
  { method: 'GET', path: '/api/analytics/generation', desc: 'Generation charts data' },
  { method: 'GET', path: '/api/activity-logs', desc: 'Audit log' },
  { method: 'GET', path: '/api/settings', desc: 'Settings + notifications' },
]

const FAQ = [
  { q: 'What are the demo credentials?', a: 'Admin: admin@bulkcert.io / admin123. Staff: staff@bulkcert.io / staff123.' },
  { q: 'How do I create a bulk generation?', a: 'Go to Generate Certificates, complete the 7-step wizard, then review and confirm. One API request triggers the bulk generation.' },
  { q: 'Can I download all certificates at once?', a: 'Yes. On the Progress page after completion, or on the Jobs page, click Download ZIP. The ZIP contains a certificates/ folder and a generation_report.csv.' },
  { q: 'How does verification work?', a: 'Each certificate has a unique verification token. The URL /?verify={token} opens a public verification page showing the certificate details with a green verified badge.' },
  { q: 'Where are the generated PDFs stored?', a: 'PDFs are stored under /storage/certificates/{jobId}/. The DB stores relative paths — the download endpoint never exposes absolute filesystem paths.' },
]

export function HelpPage() {
  const navigate = useNav((s) => s.navigate)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Help & Documentation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Learn how to use the Bulk Certificate Generator.</p>
      </div>

      {/* Quick start */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Quick start: the demo workflow</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW.map((w, i) => (
              <motion.div
                key={w.step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {w.step}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{w.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-4">
            <MotionButton variant="primary" size="md" onClick={() => navigate('generate')}>
              <Zap className="h-4 w-4" /> Start the workflow
            </MotionButton>
          </div>
        </CardContent>
      </Card>

      {/* API documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" /> API documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">All endpoints are relative to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api</code>. Authentication uses Bearer JWT tokens.</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Endpoint</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((e) => (
                  <tr key={e.path} className="border-t border-border">
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${e.method === 'GET' ? 'bg-blue-100 text-blue-700' : e.method === 'POST' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{e.method}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-foreground">{e.path}</td>
                    <td className="px-3 py-2 text-muted-foreground">{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk generation request */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Bulk generation request</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Submit one request with all recipients. The backend validates, creates a job, returns the job ID immediately, and processes in the background.</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
{`POST /api/generation/jobs
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "eventName": "AI & Innovation Workshop 2026",
  "organizationName": "V.S.B Engineering College",
  "certificateTitle": "Certificate of Participation",
  "templateId": "<template_id>",
  "recipients": [
    { "name": "John Doe", "email": "john@x.com" },
    { "name": "Priya Kumar", "email": "priya@x.com" }
  ],
  "settings": {
    "paperSize": "A4",
    "orientation": "landscape",
    "certificateIdPrefix": "VSB-AI-2026",
    "generateZip": true,
    "includeCsvReport": true,
    "generateQrCode": true
  }
}

Response: { "id": "...", "jobId": "JOB-2026-00001", "totalRecipients": 2 }`}
          </pre>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Returns immediately</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700"><Zap className="h-3 w-3" /> Poll /status for progress</span>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" /> FAQ</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-lg border border-border p-3">
              <div className="text-sm font-semibold text-foreground">{f.q}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.a}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <div>
          <div className="text-base font-semibold text-foreground">Ready to try?</div>
          <div className="text-sm text-muted-foreground">Sign in and run the full workflow in under two minutes.</div>
        </div>
        <MotionButton variant="primary" size="md" onClick={() => navigate('login')}>
          Sign in <ExternalLink className="h-4 w-4" />
        </MotionButton>
      </div>
    </div>
  )
}
