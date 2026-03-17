import apiClient from './client'

export async function addPrescription(appointmentId, payload) {
  const { data } = await apiClient.post(`/prescriptions/${appointmentId}`, payload)
  return data
}

export async function getMyPrescriptions() {
  const { data } = await apiClient.get('/prescriptions/my')
  return data
}
