'use client'

import { create } from 'zustand'
import type { User } from './types'
import { setAuthToken } from './api-client'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (u: User | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (u) => {
    // Note: the real JWT token is set separately by the auth flow (login/register)
    // via setAuthToken(). This store only tracks the user object.
    if (!u) {
      setAuthToken(null)
    }
    set({ user: u })
  },
  logout: () => {
    setAuthToken(null)
    set({ user: null })
  },
}))
