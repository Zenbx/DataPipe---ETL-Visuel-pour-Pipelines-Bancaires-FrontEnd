import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Organisation } from '@/types'
import { authTokens } from '@/lib/api/client'

interface AuthState {
  user: User | null
  currentOrg: Organisation | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User) => void
  setCurrentOrg: (org: Organisation) => void
  clearAuth: () => void
  setLoading: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentOrg: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

      setCurrentOrg: (org) => set({ currentOrg: org }),

      clearAuth: () => {
        authTokens.clear()
        set({ user: null, currentOrg: null, isAuthenticated: false, isLoading: false })
      },

      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'datapipe-auth',
      partialize: (state) => ({
        user: state.user,
        currentOrg: state.currentOrg,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
