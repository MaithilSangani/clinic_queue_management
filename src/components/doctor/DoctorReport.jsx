import { useState } from 'react'
import {
  addReport,
  getDoctorQueue,
  updateQueueStatus,
  extractApiError,
} from '../../api'
import { asList } from '../../utils/data'
import { norm } from '../../utils/status'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

async function completeQueueForAppointment(appointmentId) {
  const queueRes = await getDoctorQueue()
  const queue = asList(queueRes, ['queue', 'data'])

  const entry = queue.find((item) => {
    const itemAppointmentId = Number(item?.appointmentId ?? item?.appointment?.id)
    return itemAppointmentId === appointmentId
  })

  if (!entry?.id) {
    return { updated: false, message: 'Queue entry not found for this appointment.' }
  }

  const current = norm(entry.status)
  if (current === 'done') {
    return { updated: true, message: 'Queue status already done.' }
  }

  if (current === 'waiting') {
    await updateQueueStatus(entry.id, 'in_progress', 'waiting')
    await updateQueueStatus(entry.id, 'done', 'in_progress')
    return { updated: true, message: 'Queue status set to done.' }
  }

  if (current === 'in_progress') {
    await updateQueueStatus(entry.id, 'done', 'in_progress')
    return { updated: true, message: 'Queue status set to done.' }
  }

  return {
    updated: false,
    message: `Queue status is ${current || 'unknown'} and was not changed.`,
  }
}

export default function DoctorReport({ appointmentId, onIdChange }) {
  const [diagnosis, setDiagnosis] = useState('')
  const [testRecommended, setTestRecommended] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const id = Number(appointmentId)
    if (!id) {
      setError('Enter a valid appointment ID.')
      return
    }

    setLoading(true)
    try {
      await addReport(id, {
        diagnosis: diagnosis.trim(),
        ...(testRecommended.trim() ? { testRecommended: testRecommended.trim() } : {}),
        ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
      })

      let queueMessage = ''
      try {
        const queueResult = await completeQueueForAppointment(id)
        queueMessage = queueResult.message
      } catch (queueError) {
        queueMessage = extractApiError(queueError, 'Queue status was not updated.')
      }

      setSuccess(
        queueMessage
          ? `Report saved successfully. ${queueMessage}`
          : 'Report saved successfully.',
      )
      setDiagnosis('')
      setTestRecommended('')
      setRemarks('')
      onIdChange('')
    } catch (e) {
      setError(extractApiError(e, 'Failed to save report.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Add Report" sub="Diagnosis and recommendations for an appointment">
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          Appointment ID
          <input
            type="number"
            value={appointmentId}
            onChange={(e) => onIdChange(e.target.value)}
            required
            placeholder="e.g. 42"
          />
        </label>
        <label className="field">
          Diagnosis
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
            placeholder="Viral Fever"
          />
        </label>
        <label className="field">
          Test recommended (optional)
          <input
            value={testRecommended}
            onChange={(e) => setTestRecommended(e.target.value)}
            placeholder="Blood Test"
          />
        </label>
        <label className="field">
          Remarks (optional)
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Rest for 3 days"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving\u2026' : 'Save report'}
        </button>
      </form>
      <Alert type="success" msg={success} />
      <Alert type="error" msg={error} />
    </Card>
  )
}
