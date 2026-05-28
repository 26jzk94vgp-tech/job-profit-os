'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DarkModeProvider() {
  const pathname = usePathname()

  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true'
    if (saved) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [pathname])

  return null
}
