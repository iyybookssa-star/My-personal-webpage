import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const API = '/api/settings'

/* ── Default settings ─────────────────────────────────────── */
export const DEFAULT_SETTINGS: AdminSettings = {
  accentColor: '#4f81ff',
  backgroundColor: '#141313',
  surfaceColor: '#1c1b1b',
  onSurfaceColor: '#e5e2e1',
  onSurfaceVariantColor: '#c4c7c7',
  secondaryColor: '#c6c7c2',
  headingFont: 'Playfair Display',
  bodyFont: 'Hanken Grotesk',
  displayFontSize: 64,
  headlineFontSize: 32,
  bodyFontSize: 16,
  borderRadius: '0.25',
  sectionGap: '120',
  cardStyle: 'grid' as const,
  siteTitle: 'Ibrahim’s Digest',
  footerCopy: '© 2024 Digital Curator Archive',
  heroLabel: 'Archive 01',
  heroTitle: 'A curated space for the things I love.',
  heroSubtitle: 'Documenting thoughts on cinema, literature, and digital landscapes. A high-fidelity record of personal exploration.',
  watchingTitle: 'Currently Watching',
  libraryTitle: 'In the Library',
  thoughtsTitle: 'Recent Thoughts',
  filmPageTitle: 'Film Archive',
  filmPageDesc: 'An archival record of narratives experienced, worlds explored, and the lingering thoughts left behind.',
  gamesPageTitle: 'Games Archive',
  gamesPageDesc: 'A meticulous catalog of interactive digital experiences.',
  booksPageTitle: 'The Library',
  booksPageDesc: 'A curated collection of volumes shaping perspective.',
  journalPageTitle: 'Notes from the Archive',
  journalPageDesc: 'A collection of thoughts, reflections, and deep dives into the spaces between technology, philosophy, and daily existence.',
  letterboxdUsername: 'engelibrahimo',
  autoSyncEnabled: true,
  lastSyncedAt: null,
  lastSyncStatus: 'idle',
  lastSyncMessage: '',
  lastSyncCount: 0,
}

export interface AdminSettings {
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  onSurfaceColor: string
  onSurfaceVariantColor: string
  secondaryColor: string
  headingFont: string
  bodyFont: string
  displayFontSize: number
  headlineFontSize: number
  bodyFontSize: number
  borderRadius: string
  sectionGap: string
  cardStyle: 'grid' | 'list'
  siteTitle: string
  footerCopy: string
  heroLabel: string
  heroTitle: string
  heroSubtitle: string
  watchingTitle: string
  libraryTitle: string
  thoughtsTitle: string
  filmPageTitle: string
  filmPageDesc: string
  gamesPageTitle: string
  gamesPageDesc: string
  booksPageTitle: string
  booksPageDesc: string
  journalPageTitle: string
  journalPageDesc: string
  letterboxdUsername: string
  autoSyncEnabled?: boolean
  lastSyncedAt?: string | null
  lastSyncStatus?: string
  lastSyncMessage?: string
  lastSyncCount?: number
}

interface AdminContextValue {
  settings: AdminSettings
  updateSetting: <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => void
  resetSettings: () => void
  isAuthenticated: boolean
  login: (password: string) => Promise<boolean>
  logout: () => void
  dbConnected: boolean
  visits: number
  subscriberCount: number
}

const STORAGE_KEY = 'curator_admin_settings'
const AUTH_KEY = 'curator_admin_auth'
const ADMIN_PASSWORD = '2240002989'

const AdminContext = createContext<AdminContextValue | null>(null)

/* ── Apply CSS variables to :root ─────────────────────────── */
function applySettings(s: AdminSettings) {
  const root = document.documentElement
  root.style.setProperty('--tertiary', s.accentColor)
  root.style.setProperty('--background', s.backgroundColor)
  root.style.setProperty('--surface', s.backgroundColor)
  root.style.setProperty('--surface-dim', s.backgroundColor)
  root.style.setProperty('--surface-container-low', s.surfaceColor)
  root.style.setProperty('--on-surface', s.onSurfaceColor)
  root.style.setProperty('--on-background', s.onSurfaceColor)
  root.style.setProperty('--on-surface-variant', s.onSurfaceVariantColor)
  root.style.setProperty('--secondary', s.secondaryColor)
  root.style.setProperty('--radius', `${s.borderRadius}rem`)
  root.style.setProperty('--section-gap', `${s.sectionGap}px`)
}

/* ── Debounce helper ──────────────────────────────────────── */
let saveTimer: ReturnType<typeof setTimeout> | null = null
function debounceSave(fn: () => void, ms = 600) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(fn, ms)
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_KEY) === 'true'
  )
  const [dbConnected, setDbConnected] = useState(false)
  const [visits, setVisits] = useState(0)
  const [subscriberCount, setSubscriberCount] = useState(0)

  /* ── Load from MongoDB + Increment Visits on mount ────────── */
  useEffect(() => {
    // 1. Fetch site settings
    fetch(API)
      .then((r) => r.json())
      .then((data) => {
        const merged: AdminSettings = { ...DEFAULT_SETTINGS }
        for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof AdminSettings)[]) {
          if (data[key] !== undefined) (merged as any)[key] = data[key]
        }
        setSettings(merged)
        if (data.visits !== undefined) setVisits(data.visits)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        setDbConnected(true)
        console.log('✅ Settings loaded from MongoDB')
      })
      .catch(() => {
        console.warn('⚠️  Could not reach API — using localStorage fallback')
        setDbConnected(false)
      })

    // 2. Increment site visits count
    fetch('/api/settings/increment-visits', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.visits !== undefined) setVisits(data.visits)
      })
      .catch(() => {})

    // 3. Fetch total subscriber count
    fetch('/api/subscribers/count')
      .then((r) => r.json())
      .then((data) => {
        if (data.count !== undefined) setSubscriberCount(data.count)
      })
      .catch(() => {})
  }, [])

  /* ── Apply CSS vars whenever settings change ─────────────── */
  useEffect(() => {
    applySettings(settings)
  }, [settings])

  /* ── Save to MongoDB (debounced) + localStorage (immediate) ─ */
  const persistSettings = (next: AdminSettings) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    debounceSave(() => {
      fetch(API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => console.warn('⚠️  Could not save to MongoDB'))
    })
  }

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      persistSettings(next)
      return next
    })
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem(STORAGE_KEY)
    fetch(API, { method: 'DELETE' }).catch(() => {})
  }

  const login = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem(AUTH_KEY, 'true')
        if (data.token) {
          localStorage.setItem('curator_admin_token', data.token)
        }
        setIsAuthenticated(true)
        return true
      }
    } catch (err) {
      console.warn('⚠️ Server auth failed, trying local fallback')
    }

    // Local fallback
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    localStorage.removeItem('curator_admin_token')
    setIsAuthenticated(false)
  }

  return (
    <AdminContext.Provider value={{ settings, updateSetting, resetSettings, isAuthenticated, login, logout, dbConnected, visits, subscriberCount }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be inside AdminProvider')
  return ctx
}
