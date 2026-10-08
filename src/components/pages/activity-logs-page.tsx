'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { History, Search, User as UserIcon, Activity } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { ActivityLog, Paginated } from '@/lib/types'
import { StatusBadge } from '@/components/status-badge'
import { TableEmpty } from '@/components/empty-state'
import { toast } from 'sonner'
import { formatDate, formatRelative, debounce } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-blue-50 text-blue-600',
  GENERATION_STARTED: 'bg-amber-50 text-amber-600',
  GENERATION_COMPLETED: 'bg-emerald-50 text-emerald-600',
  GENERATION_FAILED: 'bg-red-50 text-red-600',
  CERTIFICATE_DOWNLOADED: 'bg-purple-50 text-purple-600',
  TEMPLATE_CREATED: 'bg-indigo-50 text-indigo-600',
  RECIPIENT_IMPORTED: 'bg-cyan-50 text-cyan-600',
  JOB_CANCELLED: 'bg-zinc-50 text-zinc-600',
  JOB_RETRIED: 'bg-orange-50 text-orange-600',
  SETTINGS_CHANGED: 'bg-slate-50 text-slate-600',
}

export function ActivityLogsPage() {
  const [data, setData] = useState<Paginated<ActivityLog> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(debounce((s: string, p: number) => {
    setLoading(true)
    const q = new URLSearchParams({ search: s, page: String(p), pageSize: '15' })
    api.get<Paginated<ActivityLog>>(`/activity-logs?${q}`).then((r) => {
      setData(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, 350), [])

  useEffect(() => { load(search, page) }, [search, page, load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Activity Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Audit trail of all important actions.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by user, action, resource..." className="pl-9" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Action</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Resource</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">IP</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border"><td colSpan={7} className="px-3 py-3"><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
                  ))
                ) : data && data.items.length > 0 ? (
                  data.items.map((log, i) => (
                    <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-t border-border hover:bg-accent/30">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatRelative(log.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {log.userName?.charAt(0).toUpperCase() ?? 'U'}
                          </div>
                          <span className="text-foreground text-xs">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium', ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground')}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{log.resource ?? '—'}{log.resourceId ? ` · ${log.resourceId}` : ''}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={log.status} /></td>
                      <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground">{log.ipAddress ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                        {log.details ? (() => { try { return JSON.stringify(JSON.parse(log.details)) } catch { return log.details } })() : '—'}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <TableEmpty message="No activity logs found." />
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">Showing {(data.page - 1) * 15 + 1}–{Math.min(data.page * 15, data.total)} of {data.total}</div>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">‹</button>
                <span className="inline-flex h-8 items-center px-2 text-muted-foreground">{page} / {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
