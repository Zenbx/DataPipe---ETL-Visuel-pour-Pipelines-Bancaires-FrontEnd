import { ApiKeysService } from '@/lib2'
import type { ApiKey } from '@/types'

type ApiKeyWithSecret = ApiKey & { key: string }

function normalizeApiKey(raw: Record<string, unknown>): ApiKey {
  const scopes = raw.scopes
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    prefix: String(raw.prefix ?? raw.key_prefix ?? ''),
    scopes: Array.isArray(scopes) ? scopes.map(String) : [],
    created_at: String(raw.created_at ?? ''),
    last_used_at: raw.last_used_at != null ? String(raw.last_used_at) : undefined,
  }
}

export const apiKeysApi = {
  async list(): Promise<ApiKey[]> {
    const raw = await ApiKeysService.getApiKeys()
    const items = raw.api_keys ?? []
    return items.map((k) => normalizeApiKey(k as Record<string, unknown>))
  },

  /**
   * Crée une clé. Le backend n'accepte que le nom (les scopes sont gérés
   * côté front pour l'affichage) et renvoie la clé en clair une seule fois.
   */
  async create(data: { name: string; scopes: string[] }): Promise<ApiKeyWithSecret> {
    const raw = (await ApiKeysService.postApiKeys({ name: data.name })) as Record<string, unknown>
    const k = (raw.api_key ?? raw) as Record<string, unknown>
    const secret = String(raw.key ?? k.key ?? '')
    return {
      ...normalizeApiKey({ ...k, scopes: k.scopes ?? data.scopes }),
      prefix: String(k.prefix ?? k.key_prefix ?? secret.slice(0, 8)),
      key: secret,
    }
  },

  async revoke(keyId: string) {
    await ApiKeysService.deleteApiKeys(keyId)
  },
}
