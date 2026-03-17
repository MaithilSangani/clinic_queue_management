import { AUTH_STORAGE_KEY } from '../constants'

export function isJwtExpired(token) {
  try {
    const part = String(token || '').split('.')[1]
    if (!part) return true
    const padded = part
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(part.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded))
    const exp = Number(payload?.exp)
    return Number.isFinite(exp) && exp > 0 && Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.token && parsed?.user && !isJwtExpired(parsed.token)) return parsed
  } catch {
    return null
  }
  return null
}
