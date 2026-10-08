'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  FileCheck2,
  Users,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import type { AnalyticsOverview, AnalyticsGeneration } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/animated-counter'
import { EmptyState } from '@/components/empty-state'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { cn } from '@/lib/utils'

const STATUS_PIE_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  PROCESSING: '#3b82f6',
  PENDING: '#94a3b8',
  FAILED: '#ef4444',
  PARTIALLY_COMPLETED: '#f59e0b',
  CANCELLED: '#71717a',
}

const RANGES = [
  { label: 'Today', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '3 months', days: 90 },
]

export function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [gen, setGen] = useState<AnalyticsGeneration | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsOverview>('/analytics/overview'),
      api.get<AnalyticsGeneration>(`/analytics/generation?days=${range}`),
    ]).then(([o, g]) => {
      setOverview(o)
      setGen(g)
      setLoading(false)
    })
  }, [range])

  const metrics = [
    { label: 'Total Certificates', value: overview?.totalCertificates ?? 0, icon: FileCheck2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Recipients', value: overview?.totalRecipients ?? 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Jobs', value: overview?.totalJobs ?? 0, icon: ListChecks, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Success Rate', value: overview?.successRate ?? 0, isPercent: true, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Failure Rate', value: overview?.failureRate ?? 0, isPercent: true, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Generation Time', value: overview?.avgGenerationTimeSec ?? 0, suffix: 's', decimals: 1, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Insights into your certificate generation operations.</p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setRange(r.days)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium', range === r.days ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', m.bg, m.color)}>
                  <m.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-2xl font-bold text-foreground">
                  {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-muted" /> :
                    m.isPercent ? <AnimatedCounter value={m.value} decimals={1} suffix="%" /> :
                    <AnimatedCounter value={m.value} suffix={(m as any).suffix ?? ''} decimals={(m as any).decimals ?? 0} />}
                </div>
                <div className="text-xs font-medium text-foreground">{m.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Certificates per day</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse rounded bg-muted" /> :
              gen && gen.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={gen.daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3b82f6" name="Generated" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState variant="compact" title="No data" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly trends</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse rounded bg-muted" /> :
              gen && gen.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={gen.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState variant="compact" title="No data" />}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Job status distribution</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse rounded bg-muted" /> :
              gen && gen.jobStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={gen.jobStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {gen.jobStatus.map((e) => <Cell key={e.status} fill={STATUS_PIE_COLORS[e.status] ?? '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState variant="compact" title="No jobs" />}
            <div className="mt-2 flex flex-wrap gap-2">
              {gen?.jobStatus.map((j) => (
                <span key={j.status} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_PIE_COLORS[j.status] ?? '#94a3b8' }} />
                  {j.status.replace(/_/g, ' ')} ({j.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Top events by certificate count</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="h-64 animate-pulse rounded bg-muted" /> :
              gen && gen.topEvents.length > 0 ? (
                <div className="space-y-2">
                  {gen.topEvents.map((e, i) => {
                    const max = gen.topEvents[0]?.count ?? 1
                    return (
                      <div key={e.eventName} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground truncate">{e.eventName}</span>
                            <span className="text-muted-foreground">{e.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(e.count / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.05 }} className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <EmptyState variant="compact" title="No events" />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Template usage</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="h-64 animate-pulse rounded bg-muted" /> :
            gen && gen.templateUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={gen.templateUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState variant="compact" title="No template usage" />}
        </CardContent>
      </Card>
    </div>
  )
}
