import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Field, FormError } from '../components/FieldErrors'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username_or_email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form)
      navigate('/app', { replace: true })
    } catch (err) {
      // Toast and drawer already have it from the api client; this renders it
      // next to the inputs, which is where field errors belong.
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <h1>Log in</h1>
      <p className="sub">POST /auth/login — routers/auth.py:61</p>
      <FormError error={error} />
      <form onSubmit={onSubmit}>
        <Field label="Username or email" name="username_or_email" error={error}>
          {(invalid) => (
            <input
              id="username_or_email"
              className={invalid ? 'invalid' : ''}
              value={form.username_or_email}
              onChange={set('username_or_email')}
              autoComplete="username"
            />
          )}
        </Field>
        <Field label="Password" name="password" error={error}>
          {(invalid) => (
            <input
              id="password"
              type="password"
              className={invalid ? 'invalid' : ''}
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
            />
          )}
        </Field>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="sub" style={{ marginTop: 14 }}>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}
