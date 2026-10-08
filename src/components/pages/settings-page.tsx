'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Building2,
  FileText,
  Bell,
  Shield,
  Palette,
  Save,
  Check,
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-store'
import { MotionButton } from '@/components/motion-button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from 'next-themes'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'defaults', label: 'Certificate Defaults', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Palette },
]

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [active, setActive] = useState('profile')
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [org, setOrg] = useState({ name: '', address: '', website: '', email: '', phone: '', logo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<{ settings: Record<string, string>; notifications: any[] }>('/settings').then((r) => {
      setSettings(r.settings)
      if (r.settings.organizationName) {
        setOrg({
          name: r.settings.organizationName ?? '',
          address: r.settings.organizationAddress ?? '',
          website: r.settings.organizationWebsite ?? '',
          email: r.settings.organizationEmail ?? '',
          phone: r.settings.organizationPhone ?? '',
          logo: r.settings.organizationLogo ?? '',
        })
      }
    })
  }, [])

  async function save(patch: Record<string, string>) {
    setSaving(true)
    try {
      await api.patch('/settings', { settings: patch })
      toast.success('Settings saved')
      setSettings({ ...settings, ...patch })
    } catch (e: any) {
      toast.error(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, organization, and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium', active === s.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card>
            <CardContent className="p-6">
              {active === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">{user?.name}</div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
                      <span className="inline-flex mt-1 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{user?.role}</span>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>Full name</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1" /></div>
                    <div><Label>Email</Label><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1" /></div>
                  </div>
                  <MotionButton variant="primary" size="sm" loading={saving} onClick={() => save({ userName: profile.name, userEmail: profile.email })}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </MotionButton>
                </div>
              )}

              {active === 'organization' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><Label>Organization name</Label><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} className="mt-1" /></div>
                    <div><Label>Website</Label><Input value={org.website} onChange={(e) => setOrg({ ...org, website: e.target.value })} className="mt-1" /></div>
                    <div><Label>Email</Label><Input value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} className="mt-1" /></div>
                    <div><Label>Phone</Label><Input value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div><Label>Address</Label><Textarea value={org.address} onChange={(e) => setOrg({ ...org, address: e.target.value })} className="mt-1" rows={2} /></div>
                  <MotionButton variant="primary" size="sm" loading={saving} onClick={() => save({
                    organizationName: org.name, organizationAddress: org.address, organizationWebsite: org.website, organizationEmail: org.email, organizationPhone: org.phone, organizationLogo: org.logo
                  })}>
                    <Save className="h-3.5 w-3.5" /> Save
                  </MotionButton>
                </div>
              )}

              {active === 'defaults' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <Label>Default paper size</Label>
                      <Select value={settings.defaultPaperSize ?? 'A4'} onValueChange={(v) => save({ defaultPaperSize: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Default orientation</Label>
                      <Select value={settings.defaultOrientation ?? 'landscape'} onValueChange={(v) => save({ defaultOrientation: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">Landscape</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Default prefix</Label><Input value={settings.defaultPrefix ?? 'VSB'} onChange={(e) => save({ defaultPrefix: e.target.value })} className="mt-1" /></div>
                  </div>
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    These defaults are used when creating new generation jobs.
                  </div>
                </div>
              )}

              {active === 'notifications' && (
                <div className="space-y-3">
                  {[
                    { key: 'notifyGenerationComplete', label: 'Generation completed', desc: 'Notify when a generation job finishes successfully.' },
                    { key: 'notifyGenerationFailed', label: 'Generation failed', desc: 'Notify when a generation job fails.' },
                    { key: 'notifyEmail', label: 'Email notifications', desc: 'Send notifications via email (SMTP integration).' },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{n.label}</div>
                        <div className="text-xs text-muted-foreground">{n.desc}</div>
                      </div>
                      <Switch
                        checked={settings[n.key] === 'true'}
                        onCheckedChange={(v) => save({ [n.key]: String(v) })}
                      />
                    </div>
                  ))}
                </div>
              )}

              {active === 'security' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm font-semibold text-foreground mb-3">Change password</div>
                    <div className="space-y-3 max-w-md">
                      <div><Label>Current password</Label><Input type="password" className="mt-1" /></div>
                      <div><Label>New password</Label><Input type="password" className="mt-1" /></div>
                      <div><Label>Confirm new password</Label><Input type="password" className="mt-1" /></div>
                      <MotionButton variant="primary" size="sm" onClick={() => toast.info('Password change is disabled in the demo.')}>
                        <Shield className="h-3.5 w-3.5" /> Update password
                      </MotionButton>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="text-sm font-semibold text-foreground mb-3">Active sessions</div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-foreground">Current session</div>
                        <div className="text-xs text-muted-foreground">Web browser · This device</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {active === 'system' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Theme</Label>
                      <Select value={theme ?? 'light'} onValueChange={(v) => { setTheme(v); save({ theme: v }) }}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Language</Label>
                      <Select value={settings.language ?? 'en'} onValueChange={(v) => save({ language: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="hi">हिन्दी</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Select value={settings.timezone ?? 'Asia/Shanghai'} onValueChange={(v) => save({ timezone: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                          <SelectItem value="America/New_York">America/New York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
