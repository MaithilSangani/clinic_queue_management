import apiClient from './client'

export async function bookAppointment(payload) {
  const { data } = await apiClient.post('/appointments', payload)
  return data
}

export async function getMyAppointments() {
  const { data } = await apiClient.get('/appointments/my')
  return data
}

export async function getAppointmentDetails(appointmentId) {
  const { data } = await apiClient.get(`/appointments/${appointmentId}`)
  return data
}
