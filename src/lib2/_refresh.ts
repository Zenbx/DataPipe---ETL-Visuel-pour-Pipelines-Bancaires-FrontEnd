/**
 * Hook de refresh injecté par l'app (`lib/api/client`) pour permettre au client
 * généré de rejouer UNE fois une requête ayant reçu un 401 (access_token expiré).
 *
 * Module « feuille » : il n'importe rien, ce qui évite toute dépendance
 * circulaire entre le client généré (`lib2`) et le code applicatif (`lib`).
 */
let refreshHook: (() => Promise<boolean>) | null = null

export const setRefreshHook = (fn: () => Promise<boolean>): void => {
  refreshHook = fn
}

export const tryRefresh = (): Promise<boolean> =>
  refreshHook ? refreshHook() : Promise.resolve(false)
