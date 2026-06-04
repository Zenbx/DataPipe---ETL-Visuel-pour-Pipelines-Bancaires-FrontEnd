import { OpenAPI } from '@/lib2'
import { registerAuthRefresh } from '@/lib2/core/authRefresh'

/**
 * Configuration centrale du client API généré (lib2).
 *
 * - BASE     : dérivée de NEXT_PUBLIC_API_URL (+ /api/v1)
 * - TOKEN    : resolver qui injecte l'access_token courant sur chaque requête
 * - Refresh  : rafraîchissement proactif de l'access_token avant expiration
 *
 * Le client généré (fetch) n'a pas d'intercepteur 401 : on s'appuie donc sur
 * un refresh proactif basé sur `expires_in`, plus un refresh au démarrage.
 */

/**
 * Base de l'API.
 *
 * Par défaut on utilise un chemin RELATIF (`/api/v1`) : le navigateur appelle
 * la même origine que l'app, et le proxy Next (voir `next.config.ts`) relaie
 * vers le backend (VPS). Cela évite tout problème de CORS.
 *
 * `NEXT_PUBLIC_API_URL` reste possible pour cibler une API distante en direct
 * (le backend doit alors autoriser le CORS de cette origine).
 */
const API_ROOT = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ?? ''
export const API_BASE = `${API_ROOT}/api/v1`

/**
 * Base ABSOLUE du backend public, pour afficher des URLs appelables de
 * l'extérieur (ex: webhooks entrants). Contrairement à `API_BASE` (relative,
 * proxifiée), celle-ci pointe directement vers le VPS.
 */
const PUBLIC_API_ROOT = (
  process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? ''
).replace(/\/+$/, '')
export const PUBLIC_API_BASE = `${PUBLIC_API_ROOT}/api/v1`

/**
 * Base WebSocket. Les rewrites Next ne proxifient PAS les WebSockets : il faut
 * pointer le WS DIRECTEMENT vers le backend.
 *
 * Ordre de résolution :
 *  1. NEXT_PUBLIC_WS_URL  → URL WS dédiée (recommandé : garde le proxy pour
 *     l'API + WS direct vers le backend). Ex: ws://localhost:8000
 *  2. NEXT_PUBLIC_API_URL → si l'API tape déjà le backend en direct, on en
 *     dérive le WS (http→ws).
 *  3. Sinon (mode proxy pur) → '' : WS désactivé. L'animation des nœuds est
 *     dérivée des logs SSE (runWatcher), donc rien n'est cassé.
 */
export function getWebSocketBase(): string {
  if (typeof window === 'undefined') return ''
  const explicit = process.env.NEXT_PUBLIC_WS_URL
  if (explicit) return explicit.replace(/\/+$/, '').replace(/^http/, 'ws')
  if (API_ROOT) return API_ROOT.replace(/^http/, 'ws')
  return ''
}

const REFRESH_STORAGE_KEY = 'dp_refresh_token'

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshTimer: ReturnType<typeof setTimeout> | null = null

OpenAPI.BASE = API_BASE
OpenAPI.TOKEN = async () => accessToken ?? ''

// Permet au client généré de rejouer une requête après un 401 (token expiré).
// `refreshAccessToken` est hoistée (function declaration) -> référence sûre ici.
registerAuthRefresh(refreshAccessToken)

function persistRefresh(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) window.localStorage.setItem(REFRESH_STORAGE_KEY, token)
  else window.localStorage.removeItem(REFRESH_STORAGE_KEY)
}

function readPersistedRefresh(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_STORAGE_KEY)
}

function clearRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }
}

function scheduleRefresh(expiresInSeconds?: number) {
  clearRefreshTimer()
  if (typeof window === 'undefined') return
  // Rafraîchit 60s avant l'expiration (min 30s), défaut 15min.
  const expires = expiresInSeconds && expiresInSeconds > 0 ? expiresInSeconds : 900
  const delayMs = Math.max(expires - 60, 30) * 1000
  refreshTimer = setTimeout(() => { void refreshAccessToken() }, delayMs)
}

export const authTokens = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,
  isAuthenticated: () => Boolean(accessToken),

  /** Enregistre les tokens reçus après login / register / verify-email. */
  set(access: string, refresh?: string, expiresIn?: number) {
    accessToken = access
    if (refresh !== undefined) {
      refreshToken = refresh
      persistRefresh(refresh)
    }
    scheduleRefresh(expiresIn)
  },

  /** Vide tout l'état d'auth (logout / échec de refresh). */
  clear() {
    accessToken = null
    refreshToken = null
    clearRefreshTimer()
    persistRefresh(null)
  },
}

/**
 * Rafraîchit l'access_token via le refresh_token.
 *
 * Le backend protège `/auth/refresh-token` par `@jwt_required(refresh=True)` :
 * le refresh_token doit donc être envoyé dans l'en-tête Authorization, pas le
 * body. On fait un fetch direct plutôt que de passer par le client généré (qui
 * injecte l'access_token).
 */
let refreshPromise: Promise<boolean> | null = null

/**
 * Singleflight : un SEUL refresh en vol à la fois, partagé par tous les
 * appelants concurrents. Indispensable car le backend ROTATIONNE et blackliste
 * l'ancien refresh_token à chaque appel -> deux refresh concurrents se
 * 401 mutuellement (et écraseraient le bon token). Déclaration `function`
 * (hoistée) pour que `setRefreshHook(refreshAccessToken)` plus haut soit sûr.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = performRefresh().finally(() => { refreshPromise = null })
  return refreshPromise
}

async function performRefresh(): Promise<boolean> {
  if (!refreshToken) refreshToken = readPersistedRefresh()
  if (!refreshToken) return false

  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: '{}',
    })
    if (!res.ok) {
      authTokens.clear()
      return false
    }
    const data = (await res.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!data.access_token) {
      authTokens.clear()
      return false
    }
    authTokens.set(data.access_token, data.refresh_token, data.expires_in)
    return true
  } catch {
    authTokens.clear()
    return false
  }
}

/**
 * Initialise le client au démarrage : tente de restaurer une session depuis le
 * refresh_token persistant. Retourne true si une session a pu être restaurée.
 */
export async function initApiClient(): Promise<boolean> {
  refreshToken = readPersistedRefresh()
  if (!refreshToken) return false
  return refreshAccessToken()
}
