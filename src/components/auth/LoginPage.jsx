import { useState } from 'react'
import { login, setAuthToken, extractApiError } from '../../api'
import { AUTH_STORAGE_KEY } from '../../constants'
import Alert from '../shared/Alert'

export default function LoginPage({ onLogin, sessionError }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(email.trim(), password)
      if (!res?.token || !res?.user) throw new Error('Invalid response from server.')
      const session = { token: res.token, user: res.user }
      setAuthToken(session.token)
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
      } catch {
        void 0
      }
      onLogin(session)
    } catch (err) {
      setError(extractApiError(err, 'Sign in failed. Check your credentials.'))
      setAuthToken(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="14" fill="#0f766e" />
            <path d="M24 12v24M12 24h24" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="login-eyebrow">Clinic Queue Management System</p>
        <h1 className="login-heading">Sign in to your workspace</h1>
        <p className="login-hint">Use your assigned clinic email and password.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              placeholder="you@clinic.local"
            />
          </label>
          <label className="field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Your password"
            />
          </label>
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Signing in\u2026' : 'Sign in'}
          </button>
        </form>
        <Alert type="error" msg={error || sessionError} />
      </div>
    </main>
  )
}
