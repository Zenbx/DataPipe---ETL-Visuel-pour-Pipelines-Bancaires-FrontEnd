'use client'

import { Plus } from 'lucide-react'
import { useEditorStore } from '@/store/editor.store'
import { useUIStore } from '@/store/ui.store'

// Indice « action rapide » affiché quand le canvas est vide (nouveau pipeline).
// Carré en pointillés + plus au centre + libellé ; clic = ouvre le panel des nœuds.
export function EmptyCanvasHint() {
  const hasNodes = useEditorStore((s) => s.nodes.length > 0)
  const openNodeDrawer = useUIStore((s) => s.openNodeDrawer)

  if (hasNodes) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <button
        onClick={() => openNodeDrawer()}
        className="pointer-events-auto group flex flex-col items-center gap-3"
      >
        <span
          className="flex items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-105"
          style={{
            width: 96, height: 96,
            border: '3px dashed #ffffff',
            background: 'transparent',
          }}
        >
          <Plus
            className="transition-transform duration-200 group-hover:rotate-90"
            style={{ width: 36, height: 36, color: '#ffffff' }}
            strokeWidth={2}
          />
        </span>
        <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Ajouter votre nœud
        </span>
      </button>
    </div>
  )
}
