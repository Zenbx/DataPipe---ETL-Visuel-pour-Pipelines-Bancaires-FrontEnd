'use client'

import { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { apiKeysApi } from '@/lib/api/apikeys'
import { ApiKeyScopeBadge, ApiKeyScopeSelector } from '@/components/settings/ApiKeyScopeSelector'
import { getRelativeTime } from '@/lib/utils'
import { toast } from 'sonner'
import type { ApiKey } from '@/types'
import { DashboardPageShell } from '@/components/layout/DashboardPageShell'

const DEFAULT_SCOPES = ['pipelines:read']

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', scopes: [...DEFAULT_SCOPES] as string[] })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setIsLoading(true)
    try {
      setKeys(await apiKeysApi.list())
    } catch {} finally { setIsLoading(false) }
  }

  const handleCreate = async () => {
    if (form.scopes.length === 0) {
      toast.error('Sélectionnez au moins un scope')
      return
    }
    setIsCreating(true)
    try {
      const result = await apiKeysApi.create(form)
      setNewKey(result.key)
      setKeys((prev) => [...prev, result])
      toast.success('Clé créée — copiez-la maintenant !')
    } catch { toast.error('Erreur') }
    finally { setIsCreating(false) }
  }

  const handleRevoke = async (key: ApiKey) => {
    try {
      await apiKeysApi.revoke(key.id)
      setKeys((prev) => prev.filter((k) => k.id !== key.id))
      toast.success('Clé révoquée')
    } catch { toast.error('Erreur') }
  }

  const resetForm = () => {
    setNewKey(null)
    setForm({ name: '', scopes: [...DEFAULT_SCOPES] })
  }

  return (
    <DashboardPageShell
      helpKey="api-keys"
      width="narrow"
      title="Clés API"
      description="Authentifiez vos scripts et intégrations avec des permissions limitées par scope."
      actions={(
        <Button onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Nouvelle clé
        </Button>
      )}
    >
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          Aucune clé API créée
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <Card key={key.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{key.name}</p>
                  <p className="text-xs text-gray-600 font-mono truncate">{key.prefix || '—'}…</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
                  {(key.scopes ?? []).length > 0 ? (
                    (key.scopes ?? []).map((s) => <ApiKeyScopeBadge key={s} scopeId={s} />)
                  ) : (
                    <span className="text-[10px] text-gray-600">aucun scope enregistré</span>
                  )}
                </div>
                <p className="text-xs text-gray-700 whitespace-nowrap hidden sm:block">
                  {key.last_used_at ? getRelativeTime(key.last_used_at) : 'jamais'}
                </p>
                <Button variant="ghost" size="icon-sm" onClick={() => handleRevoke(key)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(v) => {
          setShowCreate(v)
          if (!v) resetForm()
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvelle clé API</DialogTitle></DialogHeader>
          {newKey ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                <p className="text-xs text-amber-400 font-semibold">Copiez cette clé maintenant — elle ne sera plus affichée</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-background px-3 py-2 text-xs text-emerald-400 font-mono break-all">{newKey}</code>
                  <Button size="icon-sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copié !') }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {form.scopes.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-xs font-medium text-foreground">Scopes attribués</p>
                  <div className="flex flex-wrap gap-1">
                    {form.scopes.map((s) => (
                      <ApiKeyScopeBadge key={s} scopeId={s} />
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => { setShowCreate(false); resetForm() }}>Fermer</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input placeholder="Ex: CI/CD — déploiement nightly" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Permissions (scopes)</Label>
                  <ApiKeyScopeSelector
                    value={form.scopes}
                    onChange={(scopes) => setForm({ ...form, scopes })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate} disabled={isCreating || !form.name.trim() || form.scopes.length === 0}>
                  {isCreating ? 'Génération…' : 'Générer'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
