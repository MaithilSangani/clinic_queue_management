import { useEffect, useState } from 'react'
import { setAuthToken, setUnauthorizedHandler } from './api'
import { AUTH_STORAGE_KEY } from './constants'
import { getStoredSession } from './utils/auth'
import LoginPage from './components/auth/LoginPage'
import Dashboard from './components/layout/Dashboard'
import './App.css'

export default function App() {
  const [session, setSession] = useState(() => {
    const stored = getStoredSession()
    if (stored?.token) setAuthToken(stored.token)
    return stored
  })
  const [sessionError, setSessionError] = useState('')

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null)
      setSession(null)
      setSessionError('Your session expired. Please sign in again.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [session])

  function handleLogin(newSession) {
    setSessionError('')
    setSession(newSession)
  }

  function handleLogout() {
    setAuthToken(null)
    setSession(null)
    setSessionError('')
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} sessionError={sessionError} />
  }

  return <Dashboard session={session} onLogout={handleLogout} />
}
