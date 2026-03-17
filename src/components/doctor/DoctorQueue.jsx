import { useCallback, useEffect, useState } from 'react'
import { getDoctorQueue, updateQueueStatus, extractApiError } from '../../api'
import { asList, filterByClinic } from '../../utils/data'
import { norm } from '../../utils/status'
import Card from '../shared/Card'
import Alert from '../shared/Alert'
import Badge from '../shared/Badge'

function getPatientName(item) {
  const appointment = item?.appointment || {}
  return item?.patientName || appointment?.patient?.name || item?.patient?.name || '\u2014'
}

function isFinalStatus(status) {
  return ['done', 'skipped', 'cancelled'].includes(norm(status))
}

export default function DoctorQueue({ user, onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingEntryId, setPendingEntryId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getDoctorQueue()
      setItems(filterByClinic(asList(res, ['queue', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load queue.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  async function completeConsultation(entry) {
    const entryId = Number(entry?.id)
    const currentStatus = norm(entry?.status)

    if (!entryId) {
      setError('Queue entry ID is missing.')
      return
    }

    if (currentStatus === 'done') {
      setSuccess('This queue entry is already done.')
      return
    }

    if (currentStatus === 'skipped' || currentStatus === 'cancelled') {
      setError('Skipped or cancelled entries cannot be marked done by doctor.')
      return
    }

    if (currentStatus !== 'waiting' && currentStatus !== 'in_progress') {
      setError('Only waiting or in-progress entries can be marked done.')
      return
    }

    setPendingEntryId(entryId)
    setError('')
    setSuccess('')

    try {
      if (currentStatus === 'waiting') {
        await updateQueueStatus(entryId, 'in_progress', 'waiting')
        await updateQueueStatus(entryId, 'done', 'in_progress')
      } else {
        await updateQueueStatus(entryId, 'done', 'in_progress')
      }

      setSuccess('Doctor completed consultation. Status is now done.')
      await load()
    } catch (e) {
      setError(extractApiError(e, 'Failed to mark queue entry as done.'))
    } finally {
      setPendingEntryId(null)
    }
  }

  return (
    <Card
      title="Today's Queue"
      sub="Use ID for forms, or click Complete when consultation is finished"
      action={
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      }
    >
      {loading ? <p className="muted">Loading\u2026</p> : null}
      <Alert type="error" msg={error} />
      <Alert type="success" msg={success} />
      {!loading && items.length === 0 ? (
        <p className="muted">No patients in today's queue.</p>
      ) : null}
      {items.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Token</th>
                <th>Patient</th>
                <th>Appt. ID</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const appointment = item.appointment || {}
                const patientName = getPatientName(item)
                const isUpdating = pendingEntryId === item.id
                const canUseId = Boolean(item.appointmentId) && !isUpdating
                const canComplete = Boolean(item.id) && !isUpdating && !isFinalStatus(item.status)

                return (
                  <tr key={item.id || item.appointmentId}>
                    <td className="cell-mono">{item.id ?? '\u2014'}</td>
                    <td>
                      <strong>#{item.tokenNumber ?? '\u2014'}</strong>
                    </td>
                    <td className="cell-strong">{patientName}</td>
                    <td>{item.appointmentId ?? '\u2014'}</td>
                    <td>{appointment.appointmentDate || item.appointmentDate || '\u2014'}</td>
                    <td>{appointment.timeSlot || item.timeSlot || '\u2014'}</td>
                    <td>
                      <Badge status={item.status} />
                    </td>
                    <td>
                      <div className="actions-inline">
                        <button
                          className="btn btn-sm btn-ghost"
                          type="button"
                          disabled={!canUseId}
                          onClick={() => onSelect(item.appointmentId)}
                        >
                          Use ID
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          type="button"
                          disabled={!canComplete}
                          onClick={() => completeConsultation(item)}
                        >
                          {isUpdating ? 'Updating...' : 'Complete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  )
}
