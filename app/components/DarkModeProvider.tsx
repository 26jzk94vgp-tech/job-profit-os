'use client'

import { useEffect } from 'react'

export default function DarkModeProvider() {
  useEffect(() => {
    const saved = localStorage.getItem('darkMode') === 'true'
    if (saved) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])
  return null
}