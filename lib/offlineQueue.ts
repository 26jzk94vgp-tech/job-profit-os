import Dexie, { type Table } from 'dexie'
import { createClient } from '../utils/supabase/client'

export interface PendingEntry {
  id?: number
  table: string
  row: Record<string, unknown>
  createdAt: number
  tries: number
}

class OfflineDB extends Dexie {
  pending!: Table<PendingEntry, number>
  constructor() {
    super('cimo_offline')
    this.version(1).stores({ pending: '++id, table, createdAt' })
  }
}

const db = new OfflineDB()

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export async function saveEntry(table: string, row: Record<string, unknown>): Promise<'synced' | 'queued'> {
  const supabase = createClient()
  if (isOnline()) {
    try {
      const { error } = await supabase.from(table).insert(row)
      if (!error) return 'synced'
    } catch { /* network throw -> fall through to queue */ }
  }
  await db.pending.add({ table, row, createdAt: Date.now(), tries: 0 })
  return 'queued'
}

export async function pendingCount(): Promise<number> {
  try { return await db.pending.count() } catch { return 0 }
}

let syncing = false

export async function syncPending(): Promise<number> {
  if (syncing || !isOnline()) return 0
  syncing = true
  let flushed = 0
  try {
    const supabase = createClient()
    const items = await db.pending.orderBy('createdAt').toArray()
    for (const item of items) {
      try {
        const { error } = await supabase.from(item.table).insert(item.row)
        if (!error) {
          if (item.id != null) await db.pending.delete(item.id)
          flushed++
        } else {
          if (item.id != null) await db.pending.update(item.id, { tries: item.tries + 1 })
          break
        }
      } catch {
        break
      }
    }
  } finally {
    syncing = false
  }
  return flushed
}

let wired = false
export function initSync(onChange?: () => void) {
  if (wired || typeof window === 'undefined') return
  wired = true
  const run = async () => { const n = await syncPending(); if (n > 0 && onChange) onChange() }
  window.addEventListener('online', run)
  setInterval(run, 30000)
  run()
}
