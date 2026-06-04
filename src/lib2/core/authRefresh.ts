/** Hook enregistré par `src/lib/api/client.ts` pour rafraîchir le token sur 401. */
let refreshHandler: (() => Promise<boolean>) | null = null

export function registerAuthRefresh(fn: () => Promise<boolean>) {
  refreshHandler = fn
}

export async function tryAuthRefresh(): Promise<boolean> {
  if (!refreshHandler) return false
  return refreshHandler()
}
