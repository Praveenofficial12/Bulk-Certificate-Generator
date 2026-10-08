'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  Loader2,
  Mail,
  Phone,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useNav } from '@/lib/nav-store'
import { api } from '@/lib/api-client'
import type { Recipient, Paginated } from '@/lib/types'
import { MotionButton } from '@/components/motion-button'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState, TableEmpty } from '@/components/empty-state'
import { toast } from 'sonner'
import { downloadBlob, formatDate, debounce } from '@/lib/format'
import { useDropzone } from 'react-dropzone'
import { parseFile, applyMapping, autoDetectMapping } from '@/lib/parse'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function RecipientsPage() {
  const navigate = useNav((s) => s.navigate)
  const [data, setData] = useState<Paginated<Recipient> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Recipient | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [uploadingImport, setUploadingImport] = useState(false)

  const load = useCallback(debounce((s: string, p: number) => {
    setLoading(true)
    const q = new URLSearchParams({ search: s, page: String(p), pageSize: String(pageSize) })
    api.get<Paginated<Recipient>>(`/recipients?${q}`).then((r) => {
      setData(r)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, 350), [pageSize])

  useEffect(() => {
    load(search, page)
  }, [search, page, load])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return
      setUploadingImport(true)
      try {
        const parsed = await parseFile(file)
        const mapping = autoDetectMapping(parsed.headers)
        const rows = applyMapping(parsed.rows, mapping)
        const validRows = rows.filter((r) => r.name && r.name.trim())
        const res = await api.post<{ created: number }>('/recipients/bulk', { recipients: validRows })
        toast.success(`Imported ${res.created} recipients`)
        setImporting(false)
        load(search, page)
      } catch (e: any) {
        toast.error(e?.message ?? 'Import failed')
      } finally {
        setUploadingImport(false)
      }
    },
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  })

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    if (!data) return
    if (selected.size === data.items.length) setSelected(new Set())
    else setSelected(new Set(data.items.map((r) => r.id)))
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    try {
      await api.del('/recipients/bulk', { body: JSON.stringify({ ids: Array.from(selected) }) })
      toast.success(`Deleted ${selected.size} recipients`)
      setSelected(new Set())
      load(search, page)
    } catch (e: any) {
      toast.error(e?.message ?? 'Delete failed')
    }
  }

  async function exportCsv() {
    try {
      const r = await api.get<Paginated<Recipient>>(`/recipients?search=${encodeURIComponent(search)}&page=1&pageSize=1000`)
      const headers = ['Name', 'Email', 'Phone', 'Registration ID', 'Department', 'Institution', 'Event', 'Role', 'Status', 'Created']
      const rows = r.items.map((r) => [
        r.name, r.email ?? '', r.phone ?? '', r.registrationId ?? '', r.department ?? '', r.institution ?? '', r.event ?? '', r.role ?? '', r.status, formatDate(r.createdAt)
      ])
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'recipients-export.csv')
      toast.success('Exported recipients')
    } catch (e: any) {
      toast.error(e?.message ?? 'Export failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recipients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your recipient library.</p>
        </div>
        <div className="flex gap-2">
          <MotionButton variant="outline" size="md" onClick={() => setImporting(true)}>
            <Upload className="h-4 w-4" /> Import
          </MotionButton>
          <MotionButton variant="primary" size="md" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add Recipient
          </MotionButton>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search name, email, department..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {selected.size > 0 && (
                <MotionButton variant="destructive" size="sm" onClick={deleteSelected}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete ({selected.size})
                </MotionButton>
              )}
              <MotionButton variant="outline" size="sm" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" /> Export
              </MotionButton>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-left w-8">
                    <input type="checkbox" checked={data ? selected.size === data.items.length && data.items.length > 0 : false} onChange={toggleSelectAll} className="h-4 w-4 rounded border-border" />
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Department</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Reg ID</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Event</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Created</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td colSpan={9} className="px-3 py-3"><div className="h-6 animate-pulse rounded bg-muted" /></td>
                    </tr>
                  ))
                ) : data && data.items.length > 0 ? (
                  data.items.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-accent/30">
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="h-4 w-4 rounded border-border" />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{r.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.email ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{r.department ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono text-xs">{r.registrationId ?? '—'}</td>
                      <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[140px]">{r.event ?? '—'}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(r.createdAt)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => setEditing(r)} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`Delete ${r.name}?`)) return
                            try {
                              await api.del(`/recipients/${r.id}`)
                              toast.success('Recipient deleted')
                              load(search, page)
                            } catch (e: any) {
                              toast.error(e?.message ?? 'Delete failed')
                            }
                          }} className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <TableEmpty message="No recipients found. Add or import some to get started." />
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="text-muted-foreground">
                Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
              </div>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex h-8 items-center px-2 text-muted-foreground">{page} / {data.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="inline-flex h-8 w-8 items-center justify-center rounded border border-border disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      {(creating || editing) && (
        <RecipientDialog
          recipient={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); load(search, page) }}
        />
      )}

      {/* Import dialog */}
      <Dialog open={importing} onOpenChange={setImporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import recipients</DialogTitle>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={cn('cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors', isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}
          >
            <input {...getInputProps()} />
            {uploadingImport ? (
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="mx-auto h-8 w-8 text-primary" />
            )}
            <div className="mt-2 text-sm font-medium text-foreground">{uploadingImport ? 'Importing...' : 'Drop CSV or Excel file here'}</div>
            <div className="text-xs text-muted-foreground">Supports .csv, .xlsx — max 5MB</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RecipientDialog({ recipient, onClose, onSaved }: { recipient: Recipient | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: recipient?.name ?? '',
    email: recipient?.email ?? '',
    phone: recipient?.phone ?? '',
    registrationId: recipient?.registrationId ?? '',
    department: recipient?.department ?? '',
    institution: recipient?.institution ?? '',
    event: recipient?.event ?? '',
    role: recipient?.role ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (recipient) {
        await api.patch(`/recipients/${recipient.id}`, form)
        toast.success('Recipient updated')
      } else {
        await api.post('/recipients', form)
        toast.success('Recipient added')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipient ? 'Edit recipient' : 'Add recipient'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          <div><Label>Registration ID</Label><Input value={form.registrationId} onChange={(e) => setForm({ ...form, registrationId: e.target.value })} className="mt-1" /></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="mt-1" /></div>
          <div><Label>Institution</Label><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="mt-1" /></div>
          <div><Label>Event</Label><Input value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} className="mt-1" /></div>
          <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1" /></div>
        </div>
        <DialogFooter>
          <MotionButton variant="outline" onClick={onClose}>Cancel</MotionButton>
          <MotionButton variant="primary" onClick={save} loading={saving}><Check className="h-4 w-4" /> Save</MotionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
