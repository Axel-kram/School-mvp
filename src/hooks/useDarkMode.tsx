import React, { createContext, useContext, useEffect, useState } from 'react'

interface DarkModeContextType { dark: boolean; toggle: () => void }
const DarkModeContext = createContext<DarkModeContextType>({ dark: false, toggle: () => {} })

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('skolai-dark')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('skolai-dark', String(dark))
  }, [dark])

  return (
    <DarkModeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export const useDarkMode = () => useContext(DarkModeContext)
