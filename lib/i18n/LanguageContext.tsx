'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { en } from './en'
import { zh } from './zh'

type Lang = 'en' | 'zh'
type T = typeof en

const LanguageContext = createContext<{
  lang: Lang
  t: T
  setLang: (lang: Lang) => void
}>({
  lang: 'en',
  t: en,
  setLang: () => {}
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved === 'en' || saved === 'zh') setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  const t = lang === 'zh' ? zh : en

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

export function LangToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="text-sm font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
    >
      {lang === 'en' ? '中文' : 'English'}
    </button>
  )
}