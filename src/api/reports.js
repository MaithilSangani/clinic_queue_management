import apiClient from './client'

export async function addReport(appointmentId, payload) {
  const { data } = await apiClient.post(`/reports/${appointmentId}`, payload)
  return data
}

export async function getMyReports() {
  const { data } = await apiClient.get('/reports/my')
  return data
}
