import { createContext, useContext, useState, useCallback } from 'react'
import { businessApi } from '../api/businessApi'

const BusinessContext = createContext(null)

const BIZ_KEY   = 'solvenet_current_business'
const TOKEN_KEY = 'solvenet_token'

export function BusinessProvider({ children }) {
  const [current, setCurrent] = useState(() => {
    try {
      const saved = localStorage.getItem(BIZ_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)

  // Called after login or register — persists both token + business
  const signIn = useCallback((tokenStr, business) => {
    setToken(tokenStr)
    setCurrent(business)
    localStorage.setItem(TOKEN_KEY, tokenStr)
    localStorage.setItem(BIZ_KEY, JSON.stringify(business))
  }, [])

  // Kept for backwards-compat (seed data / business-switcher internal use)
  const selectBusiness = useCallback((business) => {
    setCurrent(business)
    if (business) localStorage.setItem(BIZ_KEY, JSON.stringify(business))
    else localStorage.removeItem(BIZ_KEY)
  }, [])

  const refreshCurrent = useCallback(async () => {
    if (!current?._id) return
    try {
      const res = await businessApi.get(current._id)
      selectBusiness(res.data)
    } catch {}
  }, [current?._id, selectBusiness])

  const clearBusiness = useCallback(() => {
    setCurrent(null)
    setToken(null)
    localStorage.removeItem(BIZ_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  return (
    <BusinessContext.Provider value={{ current, token, signIn, selectBusiness, clearBusiness, refreshCurrent }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider')
  return ctx
}
