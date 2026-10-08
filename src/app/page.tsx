'use client'

import { useEffect } from 'react'
import { useNav, hydrateNavFromUrl } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-store'
import { api } from '@/lib/api-client'
import { LandingPage } from '@/components/landing/landing-page'
import { AuthPage } from '@/components/auth/auth-page'
import { AppShell } from '@/components/app/app-shell'
import { DashboardPage } from '@/components/pages/dashboard-page'
import { GeneratePage } from '@/components/pages/generate-page'
import { ProgressPage } from '@/components/pages/progress-page'
import { RecipientsPage } from '@/components/pages/recipients-page'
import { TemplatesPage } from '@/components/pages/templates-page'
import { JobsPage } from '@/components/pages/jobs-page'
import { CertificatesPage } from '@/components/pages/certificates-page'
import { AnalyticsPage } from '@/components/pages/analytics-page'
import { ActivityLogsPage } from '@/components/pages/activity-logs-page'
import { SettingsPage } from '@/components/pages/settings-page'
import { HelpPage } from '@/components/pages/help-page'
import { VerifyPage } from '@/components/pages/verify-page'

export default function Home() {
  const { view, navigate, authed, setAuthed } = useNav()
  const { user, setUser } = useAuth()

  // Hydrate view from URL once on mount
  useEffect(() => {
    hydrateNavFromUrl()
  }, [])

  // Try to restore session
  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('bcg_token') : null
    if (token && !user) {
      api.get<{ id: string; email: string; name: string; role: 'ADMIN' | 'STAFF' }>('/auth/me')
        .then((u) => {
          setUser(u)
          setAuthed(true)
        })
        .catch(() => {
          window.localStorage.removeItem('bcg_token')
        })
    }
  }, [])

  // Public verification route — no auth needed
  if (view === 'verify') {
    return <VerifyPage />
  }

  // Landing + auth pages
  if (view === 'landing' || view === 'login' || view === 'register' || view === 'forgot' || view === 'reset') {
    if (view === 'landing') return <LandingPage />
    return <AuthPage mode={view === 'register' ? 'register' : 'login'} />
  }

  // Authenticated views
  if (!user && !authed) {
    // Redirect to login if trying to access authenticated views without session
    return <LandingPage />
  }

  // Render within app shell
  return (
    <AppShell>
      {view === 'dashboard' && <DashboardPage />}
      {view === 'generate' && <GeneratePage />}
      {view === 'progress' && <ProgressPage />}
      {view === 'recipients' && <RecipientsPage />}
      {view === 'templates' && <TemplatesPage />}
      {view === 'jobs' && <JobsPage />}
      {view === 'certificates' && <CertificatesPage />}
      {view === 'analytics' && <AnalyticsPage />}
      {view === 'activity' && <ActivityLogsPage />}
      {view === 'settings' && <SettingsPage />}
      {view === 'help' && <HelpPage />}
    </AppShell>
  )
}
