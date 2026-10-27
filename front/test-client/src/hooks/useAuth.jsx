import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '../api/endpoints'
import { setUnauthorizedHandler } from '../api/client'
import { logEvent, pushToast } from '../lib/log'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | anon | authed

  // Things that must run before the logout request is sent. useRealtime
  // registers the socket stop here, so the socket is closed deliberately
  // instead of being treated as a dropped connection and reconnected.
  const preLogout = useRef(new Set())

  const registerPreLogout = useCallback((fn) => {
    preLogout.current.add(fn)
    return () => preLogout.current.delete(fn)
  }, [])

  // A 401 from any call means the session is gone. Clearing the user is enough:
  // the route guards in App.jsx do the redirect, so no navigate() is needed
  // from outside the router.
  const sessionLost = useCallback((why) => {
    logEvent('session lost', { why })
    setUser(null)
    setStatus('anon')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler((err) => {
      logEvent('session rejected (401)', { detail: err.message })
      setUser(null)
      setStatus('anon')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  // Session probe on load. A 401 here is the normal "nobody is logged in"
  // answer, so it is silent: no toast, no redirect loop.
  useEffect(() => {
    let cancelled = false
    authApi
      .me({ silent401: true })
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authed')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('anon')
        if (err.kind === 'network') {
          pushToast({
            title: 'Backend unreachable',
            detail: err.message,
            payload: err.payload,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const me = await authApi.login(credentials)
    setUser(me)
    setStatus('authed')
    return me
  }, [])

  // routers/auth.py:31 creates the user but never creates a session or sets a
  // cookie, so signing up alone leaves the browser anonymous. To honour
  // "after success, redirect to /app" the client logs in immediately after.
  const signup = useCallback(async (form) => {
    await authApi.signup(form)
    logEvent('signup ok, chaining login', {
      note: 'POST /auth/signup sets no cookie (routers/auth.py:31), so a login call follows.',
    })
    return login({ username_or_email: form.username, password: form.password })
  }, [login])

  const logout = useCallback(async () => {
    for (const fn of preLogout.current) {
      try {
        fn()
      } catch (cause) {
        logEvent('pre-logout hook failed', { error: String(cause) })
      }
    }
    try {
      await authApi.logout()
    } catch (err) {
      // Already logged out elsewhere, or the backend is down. Either way the
      // local session is finished, so this is reported and not re-thrown.
      pushToast({
        title: 'Logout request failed',
        detail: `${err.message} — clearing this tab anyway.`,
        payload: err.payload,
        level: 'info',
      })
    }
    setUser(null)
    setStatus('anon')
  }, [])

  const value = useMemo(
    () => ({ user, status, login, signup, logout, sessionLost, registerPreLogout }),
    [user, status, login, signup, logout, sessionLost, registerPreLogout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
