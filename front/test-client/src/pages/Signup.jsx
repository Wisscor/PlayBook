import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Field, FormError } from '../components/FieldErrors'

// Mirrors UserCreate in back/app/schemas/user.py:19.
// required: firstname, lastname, username (3-50), email, password (8-100)
// optional: phone (3-15), bio (3-500), avatar
const REQUIRED = [
  ['firstname', 'First name', 'text', '3-50 characters'],
  ['lastname', 'Last name', 'text', '3-50 characters'],
  ['username', 'Username', 'text', '3-50 characters'],
  ['email', 'Email', 'email', 'must be a valid address'],
  ['password', 'Password', 'password', '8-100 characters'],
]
const OPTIONAL = [
  ['phone', 'Phone (optional)', 'text', '3-15 characters if given'],
  ['bio', 'Bio (optional)', 'text', '3-500 characters if given'],
]

const EMPTY = { firstname: '', lastname: '', username: '', email: '', password: '', phone: '', bio: '' }

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    // The optional fields carry min_length=3, so sending "" is a 422 rather
    // than "no value". Empty optionals are dropped from the body entirely.
    const body = {}
    for (const [key, value] of Object.entries(form)) {
      if (value !== '') body[key] = value
    }
    try {
      await signup(body)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const render = ([name, label, type, hint]) => (
    <Field key={name} label={`${label} — ${hint}`} name={name} error={error}>
      {(invalid) => (
        <input
          id={name}
          type={type}
          className={invalid ? 'invalid' : ''}
          value={form[name]}
          onChange={set(name)}
          autoComplete={type === 'password' ? 'new-password' : 'off'}
        />
      )}
    </Field>
  )

  return (
    <div className="auth">
      <h1>Sign up</h1>
      <p className="sub">
        POST /auth/signup — routers/auth.py:31. That route creates the user but sets no cookie, so a
        login call is chained straight after it.
      </p>
      <FormError error={error} />
      <form onSubmit={onSubmit}>
        {REQUIRED.map(render)}
        {OPTIONAL.map(render)}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Sign up'}
        </button>
      </form>
      <p className="sub" style={{ marginTop: 14 }}>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
