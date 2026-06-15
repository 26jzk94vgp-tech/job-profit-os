'use client'
import { useEffect, useState } from 'react'
import { initSync, pendingCount } from '../../lib/offlineQueue'

export default function SyncIndicator() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let alive = true
    const refresh = async () => { const n = await pendingCount(); if (alive) setCount(n) }
    initSync(refresh)
    refresh()
    const iv = setInterval(refresh, 5000)
    const onOnline = () => refresh()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOnline)
    return () => { alive = false; clearInterval(iv); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOnline) }
  }, [])

  if (count <= 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
      📡 {count} pending upload{count > 1 ? 's' : ''}
    </div>
  )
}
