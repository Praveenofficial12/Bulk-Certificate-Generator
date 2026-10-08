'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, ArrowLeft, ArrowRight, Loader2, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-store'
import { api, setAuthToken } from '@/lib/api-client'
import type { User } from '@/lib/types'
import { MotionButton } from '@/components/motion-button'
import { toast } from 'sonner'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNav((s) => s.navigate)
  const setUser = useAuth((s) => s.setUser)
  const setAuthed = useNav((s) => s.setAuthed)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const body =
        mode === 'login'
          ? { email: email.trim().toLowerCase(), password }
          : { name: name.trim(), email: email.trim().toLowerCase(), password, role: 'STAFF' }
      const res = await api.post<{ token: string; user: User }>(endpoint, body)
      setAuthToken(res.token)
      setUser(res.user)
      setAuthed(true)
      toast.success(mode === 'login' ? `Welcome back, ${res.user.name}!` : 'Account created!')
      navigate('dashboard')
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.')
      toast.error(e?.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-blue-800 p-12 text-white">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <button onClick={() => navigate('landing')} className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Award className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold">Bulk Certificate</span>
                <span className="text-[10px] text-white/70">Generator</span>
              </div>
            </button>
          </div>
          <div className="relative">
            <h2 className="text-3xl font-bold leading-tight">
              {mode === 'login' ? 'Welcome back.' : 'Join the platform.'}
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Create, manage and deliver hundreds of certificates in minutes. Track generation live, download as ZIP, and verify authenticity with secure tokens.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: 'Certificates', value: '10K+' },
                { label: 'Templates', value: '6' },
                { label: 'Success rate', value: '99%' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur p-3">
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative text-xs text-white/60">
            © {new Date().getFullYear()} Bulk Certificate Generator
          </div>
        </div>

        {/* Right form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <button
              onClick={() => navigate('landing')}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === 'login'
                ? 'Enter your credentials to access the dashboard.'
                : 'The first account you create becomes the Admin. Start generating certificates in minutes.'}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: [0, -4, 0] }}
                transition={{ duration: 0.3 }}
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Full name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <MotionButton type="submit" loading={loading} className="w-full" size="lg">
                {loading
                  ? mode === 'login' ? 'Signing in...' : 'Creating account...'
                  : mode === 'login' ? 'Sign in' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </MotionButton>
            </form>

            {mode === 'login' && (
              <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
                <div className="text-xs text-muted-foreground">
                  New here? The first account you create becomes the Admin.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('register')}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  Create your account →
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => navigate('register')} className="font-medium text-primary hover:underline">
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => navigate('login')} className="font-medium text-primary hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
