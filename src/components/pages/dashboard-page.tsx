'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck2,
  CalendarCheck,
  Loader2,
  AlertTriangle,
  Users,
  TrendingUp,
  Zap,
  Upload,
  Layers,
  ArrowRight,
  Plus,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import type { AnalyticsOverview, GenerationJob, Certificate } from '@/lib/types'
import { AnimatedCounter } from '@/components/animated-counter'
import { MotionButton } from '@/components/motion-button'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { useNav } from '@/lib/nav-store'
import { formatDate, formatRelative, formatNumber, formatPercent, getGreeting } from '@/lib/format'
import { useAuth } from '@/lib/auth-store'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_PIE_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  PROCESSING: '#3b82f6',
  PENDING: '#94a3b8',
  FAILED: '#ef4444',
  PARTIALLY_COMPLETED: '#f59e0b',
  CANCELLED: '#71717a',
}

export function DashboardPage() {
  const navigate = useNav((s) => s.navigate)
  const user = useAuth((s) => s.user)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [daily, setDaily] = useState<{ date: string; count: number; failed: number }[]>([])
  const [jobStatus, setJobStatus] = useState<{ status: string; count: number }[]>([])
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([])
  const [recentCerts, setRecentCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>('/analytics/overview').catch(() => null),
      api.get<{ daily: { date: string; count: number; failed: number }[]; jobStatus: { status: string; count: number }[] }>('/analytics/generation?days=14').catch(() => ({ daily: [], jobStatus: [] })),
      api.get<{ items: GenerationJob[] }>('/generation/jobs?pageSize=5').catch(() => ({ items: [] })),
      api.get<{ items: Certificate[] }>('/certificates?pageSize=6').catch(() => ({ items: [] })),
    ]).then(([ov, ag, jobs, certs]) => {
      if (ov) setOverview(ov)
      if (ag) {
        setDaily(ag.daily ?? [])
        setJobStatus(ag.jobStatus ?? [])
      }
      setRecentJobs(jobs?.items ?? [])
      setRecentCerts(certs?.items ?? [])
      setLoading(false)
    })
  }, [])

  const stats = [
    {
      label: 'Total Certificates',
      value: overview?.totalCertificates ?? 0,
      icon: FileCheck2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      change: '+12.5%',
      desc: 'Generated all-time',
    },
    {
      label: 'Generated Today',
      value: overview?.generatedToday ?? 0,
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      change: '+3',
      desc: 'Since midnight',
    },
    {
      label: 'Active Jobs',
      value: overview?.activeJobs ?? 0,
      icon: Loader2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      change: overview?.activeJobs ? 'live' : 'idle',
      desc: 'Currently processing',
    },
    {
      label: 'Failed Certificates',
      value: overview?.failedCertificates ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      change: overview?.failedCertificates ? 'needs attention' : 'all good',
      desc: 'Need retry',
    },
    {
      label: 'Total Recipients',
      value: overview?.totalRecipients ?? 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      change: '+5',
      desc: 'In your library',
    },
    {
      label: 'Success Rate',
      value: overview?.successRate ?? 0,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isPercent: true,
      change: '+2.1%',
      desc: 'Across all jobs',
    },
  ]

  const quickActions = [
    { label: 'New Bulk Generation', desc: 'Start a generation job', icon: Zap, action: () => navigate('generate') },
    { label: 'Add Recipients', desc: 'Manually add recipients', icon: Plus, action: () => navigate('recipients') },
    { label: 'Upload CSV', desc: 'Import recipients from CSV', icon: Upload, action: () => navigate('recipients') },
    { label: 'Manage Templates', desc: 'View certificate templates', icon: Layers, action: () => navigate('templates') },
  ]

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {user?.name ?? 'Admin'} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your certificate generation workflow from one place.
          </p>
        </div>
        <div className="flex gap-2">
          <MotionButton variant="outline" size="md" onClick={() => navigate('analytics')}>
            <Activity className="h-4 w-4" /> View Analytics
          </MotionButton>
          <MotionButton variant="primary" size="md" onClick={() => navigate('generate')}>
            <Zap className="h-4 w-4" /> Generate Certificates
          </MotionButton>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg} ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{s.change}</span>
                </div>
                <div className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" />
                  ) : s.isPercent ? (
                    <AnimatedCounter value={s.value} suffix="%" decimals={1} />
                  ) : (
                    <AnimatedCounter value={s.value} />
                  )}
                </div>
                <div className="text-xs font-medium text-foreground">{s.label}</div>
                <div className="text-[10px] text-muted-foreground">{s.desc}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            onClick={a.action}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft hover:border-primary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <a.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{a.label}</div>
              <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Generation Activity</CardTitle>
              <span className="text-xs text-muted-foreground">Last 14 days</span>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : daily.length === 0 ? (
                <EmptyState variant="compact" icon={Activity} title="No activity yet" description="Generation activity will appear here." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={daily}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" name="Generated" />
                    <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} fill="url(#colorFailed)" name="Failed" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Job Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 animate-pulse rounded bg-muted" />
              ) : jobStatus.length === 0 ? (
                <EmptyState variant="compact" icon={Layers} title="No jobs yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={jobStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {jobStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_PIE_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {jobStatus.map((j) => (
                  <span key={j.status} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_PIE_COLORS[j.status] ?? '#94a3b8' }} />
                    {j.status.replace(/_/g, ' ')} ({j.count})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent jobs + recent certificates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Generation Jobs</CardTitle>
              <button onClick={() => navigate('jobs')} className="text-xs font-medium text-primary hover:underline">
                View all
              </button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : recentJobs.length === 0 ? (
                <EmptyState variant="compact" icon={Zap} title="No jobs yet" description="Start your first bulk generation." actionLabel="Generate" onAction={() => navigate('generate')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Job ID</th>
                        <th className="pb-2 font-medium">Event</th>
                        <th className="pb-2 font-medium text-center">Recipients</th>
                        <th className="pb-2 font-medium text-center">Progress</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium text-right">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJobs.map((j) => (
                        <tr
                          key={j.id}
                          onClick={() => navigate('progress', { jobId: j.id })}
                          className="border-b border-border/50 last:border-0 hover:bg-accent/50 cursor-pointer"
                        >
                          <td className="py-2.5 font-mono text-xs text-primary">{j.jobId}</td>
                          <td className="py-2.5 font-medium text-foreground max-w-[140px] truncate">{j.eventName}</td>
                          <td className="py-2.5 text-center text-foreground">{j.totalRecipients}</td>
                          <td className="py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${j.progressPercentage}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{j.progressPercentage}%</span>
                            </div>
                          </td>
                          <td className="py-2.5"><StatusBadge status={j.status} /></td>
                          <td className="py-2.5 text-right text-xs text-muted-foreground">{formatRelative(j.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Recent Certificates</CardTitle>
              <button onClick={() => navigate('certificates')} className="text-xs font-medium text-primary hover:underline">
                View all
              </button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ) : recentCerts.length === 0 ? (
                <EmptyState variant="compact" icon={FileCheck2} title="No certificates yet" description="Generated certificates will appear here." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recentCerts.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-accent/50">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileCheck2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{c.recipientName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{c.eventName}</div>
                        <div className="text-[10px] font-mono text-primary">{c.certificateId}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('preview-certificate', { id: c.id })
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
