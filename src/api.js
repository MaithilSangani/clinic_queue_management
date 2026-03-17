import axios from 'axios'
import { getStoredSession } from './utils/auth'
import { norm, toApiStatus } from './utils/status'

export const API_BASE_URL = 'https://cmsback.sampaarsh.cloud'
const AUTH_STORAGE_KEY = 'cms-auth-session'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const ROLE_ACCESS = Object.freeze({
  admin: new Set(['getClinicInfo', 'getUsers', 'createUser']),
  patient: new Set([
    'bookAppointment',
    'getMyAppointments',
    'getAppointmentDetails',
    'getMyPrescriptions',
    'getMyReports',
  ]),
  receptionist: new Set(['getQueue', 'updateQueueStatus']),
  doctor: new Set(['getDoctorQueue', 'addPrescription', 'addReport', 'updateQueueStatus']),
})

const ALLOWED_USER_ROLES = new Set(['doctor', 'receptionist', 'patient'])

const QUEUE_TARGET_STATUSES = new Set(['in_progress', 'skipped', 'done'])

const QUEUE_TRANSITIONS = Object.freeze({
  waiting: new Set(['in_progress', 'skipped']),
  in_progress: new Set(['done']),
})

let unauthorizedHandler = null
let didNotifyUnauthorized = false

function getCurrentUser() {
  return getStoredSession()?.user || null
}

function getCurrentRole() {
  return norm(getCurrentUser()?.role)
}

function assertRoleAccess(action) {
  const role = getCurrentRole()
  if (!role) {
    throw new Error('Your session is invalid. Please sign in again.')
  }

  const allowedActions = ROLE_ACCESS[role]
  if (!allowedActions?.has(action)) {
    throw new Error('You are not allowed to access this resource.')
  }
}

function assertDate(dateValue) {
  if (!DATE_PATTERN.test(String(dateValue || ''))) {
    throw new Error('Date must be in YYYY-MM-DD format.')
  }
}

function normalizeQueueStatus(status) {
  return norm(toApiStatus(status))
}

function assertQueueTransition(currentStatus, nextStatus) {
  if (!QUEUE_TARGET_STATUSES.has(nextStatus)) {
    throw new Error('Invalid queue status.')
  }

  const current = norm(currentStatus)
  if (!current) return

  const allowedNext = QUEUE_TRANSITIONS[current]
  if (!allowedNext?.has(nextStatus)) {
    throw new Error('Invalid queue status transition.')
  }
}

function ensurePositiveId(idValue, label) {
  const id = Number(idValue)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid ${label}.`)
  }
  return id
}

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
  const status = error?.response?.status
  const url = String(error?.config?.url || '')
  const apiMessage = error?.response?.data?.message || error?.response?.data?.error
  const normalizedApiMessage = String(apiMessage || '').toLowerCase()

  if (status === 401) {
    if (normalizedApiMessage.includes('token missing or invalid')) {
      return 'Your token is missing, expired, or invalid. Please sign in again and retry.'
    }
    return 'You are not authenticated. Please sign in again.'
  }

  if (status === 400 && normalizedApiMessage.includes('duplicate')) {
    if (url.includes('/reports/')) {
      return 'A report already exists for this appointment. Each appointment can only have one report.'
    }
    if (url.includes('/prescriptions/')) {
      return 'A prescription already exists for this appointment. Each appointment can only have one prescription.'
    }
    return apiMessage || 'Duplicate value — this record already exists.'
  }

  if (status === 403 && normalizedApiMessage.includes('role not allowed')) {
    if (url.includes('/reports/my')) {
      return 'Only patient account can view My Reports. Please sign in as patient.'
    }

    if (url.includes('/reports/')) {
      return 'Only doctor account can add report. Please sign in as doctor.'
    }

    if (url.includes('/prescriptions/my')) {
      return 'Only patient account can view My Prescriptions. Please sign in as patient.'
    }

    if (url.includes('/prescriptions/')) {
      return 'Only doctor account can add prescription. Please sign in as doctor.'
    }

    if (url.includes('/queue/')) {
      return 'Queue status update is not allowed for this role by backend.'
    }

    return 'Forbidden for this role. Please use the correct account.'
  }

  return apiMessage || error?.message || fallback
}

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password })
  return data
}

export async function getClinicInfo() {
  assertRoleAccess('getClinicInfo')
  const { data } = await apiClient.get('/admin/clinic')
  return data
}

export async function getUsers() {
  assertRoleAccess('getUsers')
  const { data } = await apiClient.get('/admin/users')
  return data
}

export async function createUser(payload) {
  assertRoleAccess('createUser')

  const role = norm(payload?.role)
  if (!ALLOWED_USER_ROLES.has(role)) {
    throw new Error('Admin can only create receptionist, doctor, or patient users.')
  }

  const name = String(payload?.name || '').trim()
  const email = String(payload?.email || '').trim()
  const password = String(payload?.password || '').trim()

  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.')
  }

  const { data } = await apiClient.post('/admin/users', {
    ...payload,
    name,
    email,
    password,
    role,
  })
  return data
}

export async function bookAppointment(payload) {
  assertRoleAccess('bookAppointment')

  const appointmentDate = String(payload?.appointmentDate || '').trim()
  const timeSlot = String(payload?.timeSlot || '').trim()
  assertDate(appointmentDate)

  if (!timeSlot) {
    throw new Error('Time slot is required.')
  }

  const { data } = await apiClient.post('/appointments', payload)
  return data
}

export async function getMyAppointments() {
  assertRoleAccess('getMyAppointments')
  const { data } = await apiClient.get('/appointments/my')
  return data
}

export async function getAppointmentDetails(appointmentId) {
  assertRoleAccess('getAppointmentDetails')
  const id = ensurePositiveId(appointmentId, 'appointment ID')
  const { data } = await apiClient.get(`/appointments/${id}`)
  return data
}

export async function getQueue(date) {
  assertRoleAccess('getQueue')
  assertDate(date)
  const { data } = await apiClient.get('/queue', {
    params: { date },
  })
  return data
}

export async function updateQueueStatus(queueEntryId, status, currentStatus = '') {
  assertRoleAccess('updateQueueStatus')
  const id = ensurePositiveId(queueEntryId, 'queue entry ID')
  const nextStatus = normalizeQueueStatus(status)
  assertQueueTransition(currentStatus, nextStatus)

  const { data } = await apiClient.patch(`/queue/${id}`, {
    status: toApiStatus(nextStatus),
  })
  return data
}

export async function getDoctorQueue() {
  assertRoleAccess('getDoctorQueue')
  const { data } = await apiClient.get('/doctor/queue')
  return data
}

export async function addPrescription(appointmentId, payload) {
  assertRoleAccess('addPrescription')
  const id = ensurePositiveId(appointmentId, 'appointment ID')
  const { data } = await apiClient.post(`/prescriptions/${id}`, payload)
  return data
}

export async function getMyPrescriptions() {
  assertRoleAccess('getMyPrescriptions')
  const { data } = await apiClient.get('/prescriptions/my')
  return data
}

export async function addReport(appointmentId, payload) {
  assertRoleAccess('addReport')
  const id = ensurePositiveId(appointmentId, 'appointment ID')
  const { data } = await apiClient.post(`/reports/${id}`, payload)
  return data
}

export async function getMyReports() {
  assertRoleAccess('getMyReports')
  const { data } = await apiClient.get('/reports/my')
  return data
}
