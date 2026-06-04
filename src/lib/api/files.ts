import { FilesService, type File as ApiFile } from '@/lib2'
import type { DataFile } from '@/types'

const DEFAULT_WORKSPACE = 'default'

function toDataFile(f: ApiFile): DataFile {
  const raw = f as ApiFile & { size_bytes?: number; rows?: number; columns?: number }
  return {
    id: f.id ?? '',
    name: f.name ?? '',
    size_bytes: f.size ?? raw.size_bytes ?? 0,
    rows: f.rows_count ?? raw.rows,
    columns: f.columns_count ?? f.columns?.length ?? raw.columns,
    created_at: f.created_at ?? new Date().toISOString(),
  }
}

/** Somme des tailles de fichiers (octets → Mo, 1 décimale). */
export function bytesToStorageMb(bytes: number): number {
  if (bytes <= 0) return 0
  return Math.round((bytes / (1024 * 1024)) * 10) / 10
}

export function sumFilesStorageMb(files: DataFile[]): number {
  const bytes = files.reduce((sum, f) => sum + (f.size_bytes ?? 0), 0)
  return bytesToStorageMb(bytes)
}

function normalizeFileList(raw: unknown): ApiFile[] {
  if (Array.isArray(raw)) return raw as ApiFile[]
  if (raw && typeof raw === 'object') {
    const obj = raw as { files?: ApiFile[]; data?: ApiFile[]; items?: ApiFile[] }
    return obj.files ?? obj.data ?? obj.items ?? []
  }
  return []
}

export const filesApi = {
  async list(workspaceId: string = DEFAULT_WORKSPACE): Promise<DataFile[]> {
    const raw = await FilesService.getFiles(workspaceId)
    return normalizeFileList(raw).map(toDataFile)
  },

  async upload(file: File, workspaceId: string = DEFAULT_WORKSPACE): Promise<DataFile> {
    const res = await FilesService.postFilesUpload(file, workspaceId)
    return toDataFile(res)
  },

  async get(fileId: string): Promise<DataFile> {
    return toDataFile(await FilesService.getFiles1(fileId))
  },

  async remove(fileId: string) {
    await FilesService.deleteFiles(fileId)
  },

  async preview(fileId: string, limit = 20): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
    const raw = (await FilesService.getFilesPreview(fileId, limit)) as {
      columns?: string[]
      rows?: Record<string, unknown>[]
      data?: Record<string, unknown>[]
      preview?: Record<string, unknown>[]
    }
    // Le backend stocke l'aperçu sous `preview` (modèle File) ; on accepte aussi rows/data.
    const rows = raw.rows ?? raw.data ?? raw.preview ?? []
    const columns = raw.columns ?? (rows[0] ? Object.keys(rows[0]) : [])
    return { columns, rows }
  },

  async analyze(fileId: string) {
    return FilesService.postFilesAnalyze(fileId)
  },

  /** Stockage réel du workspace = somme des fichiers uploadés. */
  async getStorageUsageMb(workspaceId: string = DEFAULT_WORKSPACE): Promise<number> {
    const raw = await FilesService.getFiles(workspaceId)
    return sumFilesStorageMb(normalizeFileList(raw).map(toDataFile))
  },

  /** Stockage total d'une org = somme des fichiers de tous ses workspaces. */
  async getOrgStorageUsageMb(workspaceIds: string[]): Promise<number> {
    if (workspaceIds.length === 0) return 0
    const perWs = await Promise.all(
      workspaceIds.map(async (id) => {
        try {
          const raw = await FilesService.getFiles(id)
          return sumFilesStorageMb(normalizeFileList(raw).map(toDataFile))
        } catch {
          return 0
        }
      }),
    )
    return Math.round(perWs.reduce((sum, mb) => sum + mb, 0) * 10) / 10
  },
}
