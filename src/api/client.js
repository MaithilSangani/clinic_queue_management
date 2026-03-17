import axios from 'axios'

export const API_BASE_URL = 'https://cmsback.sampaarsh.cloud'
const AUTH_STORAGE_KEY = 'cms-auth-session'

let unauthorizedHandler = null
let didNotifyUnauthorized = false

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

apiClient.interceptors.request.use((config) => {
  const headers = config.headers || {}
  let token = null

  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY)
    if (rawSession) {
      const parsedSession = JSON.parse(rawSession)
      token = parsedSession?.token || null
    }
  } catch {
    token = null
  }

  const authHeader = token
    ? `Bearer ${token}`
    : apiClient.defaults.headers.common.Authorization

  if (authHeader) {
    headers.Authorization = authHeader
  }

  config.headers = headers
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    const isLoginRequest = url.includes('/auth/login')

    if (
      !isLoginRequest &&
      status === 401 &&
      typeof unauthorizedHandler === 'function' &&
      !didNotifyUnauthorized
    ) {
      didNotifyUnauthorized = true
      unauthorizedHandler(error)
    }

    return Promise.reject(error)
  },
)

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

export function setAuthToken(token) {
  didNotifyUnauthorized = false

  if (!token) {
    delete apiClient.defaults.headers.common.Authorization
    return
  }

  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

export function extractApiError(error, fallback = 'Request failed') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

export default apiClient
