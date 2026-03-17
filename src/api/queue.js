import apiClient from './client'

export async function getQueue(date) {
  const { data } = await apiClient.get('/queue', { params: { date } })
  return data
}

export async function updateQueueStatus(queueEntryId, status) {
  const { data } = await apiClient.patch(`/queue/${queueEntryId}`, { status })
  return data
}
