import apiClient from './client'

export async function getDoctorQueue() {
  const { data } = await apiClient.get('/doctor/queue')
  return data
}
