'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Zap,
  Users,
  Layers,
  ListChecks,
  FileCheck2,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  Award,
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react'
import { useNav, type ViewId } from '@/lib/nav-store'
import { useAuth } from '@/lib/auth-store'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { MotionButton } from '@/components/motion-button'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'

interface NavItem {
  id: ViewId
  label: string
  icon: any
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'generate', label: 'Generate Certificates', icon: Zap },
  { id: 'recipients', label: 'Recipients', icon: Users },
  { id: 'templates', label: 'Certificate Templates', icon: Layers },
  { id: 'jobs', label: 'Generation Jobs', icon: ListChecks },
  { id: 'certificates', label: 'Certificates', icon: FileCheck2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity Logs', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Documentation', icon: HelpCircle },
]

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string }> = {
  dashboard: { title: 'Dashboard', breadcrumb: 'Home / Dashboard' },
  generate: { title: 'Generate Certificates', breadcrumb: 'Home / Generate' },
  recipients: { title: 'Recipients', breadcrumb: 'Home / Recipients' },
  templates: { title: 'Certificate Templates', breadcrumb: 'Home / Templates' },
  jobs: { title: 'Generation Jobs', breadcrumb: 'Home / Jobs' },
  certificates: { title: 'Certificates', breadcrumb: 'Home / Certificates' },
  analytics: { title: 'Analytics', breadcrumb: 'Home / Analytics' },
  activity: { title: 'Activity Logs', breadcrumb: 'Home / Activity' },
  settings: { title: 'Settings', breadcrumb: 'Home / Settings' },
  help: { title: 'Help & Documentation', breadcrumb: 'Home / Help' },
  progress: { title: 'Generation Progress', breadcrumb: 'Home / Jobs / Progress' },
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, navigate, sidebarOpen, setSidebarOpen, params } = useNav()
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => setMounted(true), [])

  // load notifications
  useEffect(() => {
    if (!user) return
    let active = true
    api
      .get<{ settings: Record<string, string>; notifications: any[] }>('/settings')
      .then((r) => {
        if (active) setNotifications(r.notifications ?? [])
      })
      .catch(() => {})
    const interval = setInterval(() => {
      api
        .get<{ settings: Record<string, string>; notifications: any[] }>('/settings')
        .then((r) => {
          if (active) setNotifications(r.notifications ?? [])
        })
        .catch(() => {})
    }, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [user])

  const meta = PAGE_TITLES[view] ?? { title: 'Dashboard', breadcrumb: 'Home' }

  async function logout() {
    setUser(null)
    useNav.getState().setAuthed(false)
    navigate('landing')
    toast.success('Signed out successfully')
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 lg:mr-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Award className="h-4 w-4" />
          </div>
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-sm font-bold text-foreground">Bulk Certificate</span>
          </div>
        </div>
        <div className="hidden lg:flex flex-col">
          <span className="text-sm font-semibold text-foreground">{meta.title}</span>
          <span className="text-[11px] text-muted-foreground">{meta.breadcrumb}</span>
        </div>
        {/* Search (page contextual) */}
        <div className="ml-auto hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Quick search..."
              className="h-9 w-56 rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm focus:bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  // jump to certificates with search
                  navigate('certificates', { search: e.currentTarget.value.trim() })
                }
              }}
            />
          </div>
        </div>
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent">
              <Bell className="h-4 w-4" />
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="border-b border-border p-3">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="text-xs text-muted-foreground">{notifications.filter((n) => !n.read).length} unread</div>
            </div>
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className="flex w-full items-start gap-3 border-b border-border p-3 text-left last:border-0 hover:bg-accent"
                  >
                    <div className={cn(
                      'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs',
                      n.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                      n.type === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                      n.type === 'ERROR' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    )}>
                      <Bell className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Help */}
        <button
          onClick={() => navigate('help')}
          className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-accent">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-xs font-semibold text-foreground">{user?.name ?? 'User'}</span>
                <span className="text-[10px] text-muted-foreground">{user?.role ?? 'STAFF'}</span>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('settings')}>
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('settings')}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('help')}>
              <HelpCircle className="h-4 w-4" /> Help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-sidebar">
          <SidebarContent />
        </aside>

        {/* Sidebar - mobile drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border bg-sidebar lg:hidden"
              >
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Award className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">Bulk Certificate</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SidebarContent onNavigate={() => setSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + JSON.stringify(params)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="p-4 sm:p-6 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex flex-1 flex-col">
        <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin p-3">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.id)
                  onNavigate?.()
                }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.label}</span>
                {active && <motion.div layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 ring-1 ring-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold">Need help?</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Check the documentation for setup and troubleshooting.</p>
            <MotionButton variant="outline" size="sm" className="mt-3 w-full" onClick={() => navigate('help')}>
              View docs
            </MotionButton>
          </div>
        </div>
      </div>
    )
  }
}
