import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { RealtimeProvider } from './hooks/useRealtime'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AppPage from './pages/AppPage'
import Toasts from './components/Toasts'

function Gate({ children, need }) {
  const { status } = useAuth()
  if (status === 'loading') return <p className="empty">Checking session…</p>
  if (need === 'authed' && status !== 'authed') return <Navigate to="/login" replace />
  if (need === 'anon' && status === 'authed') return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toasts />
        <Routes>
          <Route path="/login" element={<Gate need="anon"><Login /></Gate>} />
          <Route path="/signup" element={<Gate need="anon"><Signup /></Gate>} />
          <Route
            path="/app"
            element={
              <Gate need="authed">
                {/* Mounted only when authenticated, so the socket is never
                    opened without a session cookie to present. */}
                <RealtimeProvider>
                  <AppPage />
                </RealtimeProvider>
              </Gate>
            }
          />
          {/* No home page and no profile page, per the brief. Anything else
              lands on /app and the gate sends it to /login if needed. */}
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
