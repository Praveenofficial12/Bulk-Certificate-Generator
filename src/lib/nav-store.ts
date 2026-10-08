'use client'

import { create } from 'zustand'

export type ViewId =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot'
  | 'reset'
  | 'verify'
  | 'dashboard'
  | 'generate'
  | 'recipients'
  | 'templates'
  | 'jobs'
  | 'certificates'
  | 'analytics'
  | 'activity'
  | 'settings'
  | 'help'
  | 'progress'
  | 'preview-certificate'

interface NavState {
  view: ViewId
  params: Record<string, string>
  // navigation
  navigate: (view: ViewId, params?: Record<string, string>) => void
  back: () => void
  history: { view: ViewId; params: Record<string, string> }[]
  // sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  // auth
  authed: boolean
  setAuthed: (a: boolean) => void
}

export const useNav = create<NavState>((set, get) => ({
  view: 'landing',
  params: {},
  history: [],
  sidebarOpen: false,
  authed: false,
  navigate: (view, params = {}) => {
    const s = get()
    set({
      view,
      params,
      history: [...s.history, { view: s.view, params: s.params }].slice(-20),
      sidebarOpen: false,
    })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' })
      // sync to URL hash so pages can be shared/bookmarked
      const hash = view === 'verify' && params.id ? `/verify/${params.id}` : `#/${view}`
      const url = new URL(window.location.href)
      url.hash = hash.replace('#/', view === 'verify' ? '' : '')
      // Use search param approach for verify to keep hash clean
      const sp = new URLSearchParams()
      if (view === 'verify' && params.id) sp.set('verify', params.id)
      if (view !== 'landing' && view !== 'login' && view !== 'register') sp.set('view', view)
      Object.entries(params).forEach(([k, v]) => {
        if (k !== 'id' || view !== 'verify') sp.set(k, v)
      })
      const newSearch = `?${sp.toString()}`
      if (newSearch !== window.location.search) {
        window.history.replaceState(null, '', `${window.location.pathname}${newSearch}`)
      }
    }
  },
  back: () => {
    const s = get()
    if (s.history.length > 0) {
      const last = s.history[s.history.length - 1]
      set({ view: last.view, params: last.params, history: s.history.slice(0, -1) })
    }
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setAuthed: (a) => set({ authed: a }),
}))

// Hydrate from URL on client mount
export function hydrateNavFromUrl() {
  if (typeof window === 'undefined') return
  const sp = new URLSearchParams(window.location.search)
  const verifyId = sp.get('verify')
  const viewParam = sp.get('view') as ViewId | null
  const params: Record<string, string> = {}
  const knownKeys = new Set(['view', 'verify'])
  sp.forEach((v, k) => {
    if (!knownKeys.has(k)) params[k] = v
  })
  if (verifyId) {
    useNav.getState().navigate('verify', { id: verifyId })
  } else if (viewParam) {
    useNav.setState({ view: viewParam, params })
  }
}
