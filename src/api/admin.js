import apiClient from './client'

export async function getClinicInfo() {
  const { data } = await apiClient.get('/admin/clinic')
  return data
}

export async function getUsers() {
  const { data } = await apiClient.get('/admin/users')
  return data
}

export async function createUser(payload) {
  const { data } = await apiClient.post('/admin/users', payload)
  return data
}
