import { create } from 'zustand'
import { authApi } from '@/api'
import type { User } from '@shared/types'

interface UserStore {
  token: string | null
  user: User | null
  loading: boolean
  isInitialized: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, nickname?: string) => Promise<void>
  fetchMe: () => Promise<void>
  logout: () => void
  setInitialized: (v: boolean) => void
  init: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  isInitialized: false,

  async login(username: string, password: string) {
    set({ loading: true })
    try {
      const res = await authApi.login(username, password)
      if (res.data) {
        const { token, user } = res.data
        localStorage.setItem('token', token)
        set({ token, user, loading: false })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  async register(username: string, password: string, nickname?: string) {
    set({ loading: true })
    try {
      const res = await authApi.register(username, password, nickname)
      if (res.data) {
        const { token, user } = res.data
        localStorage.setItem('token', token)
        set({ token, user, loading: false })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  async fetchMe() {
    try {
      const res = await authApi.getMe()
      if (res.data) {
        set({ user: res.data })
      }
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null })
    }
  },

  logout() {
    localStorage.removeItem('token')
    set({ token: null, user: null })
    window.location.href = '/login'
  },

  setInitialized(v: boolean) {
    set({ isInitialized: v })
  },

  init() {
    const token = localStorage.getItem('token')
    if (token) {
      set({ token })
      useUserStore.getState().fetchMe()
    }
  }
}))

useUserStore.getState().init()
