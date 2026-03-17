import { useCallback, useEffect, useMemo, useState } from 'react'
import { getQueue, updateQueueStatus, extractApiError } from '../../api'
import { getTodayDate, fmtDate } from '../../utils/date'
import { norm } from '../../utils/status'
import { asList, filterByClinic } from '../../utils/data'
import Card from '../shared/Card'
import Alert from '../shared/Alert'
import Badge from '../shared/Badge'

function byTokenAsc(a, b) {
  const tokenA = Number(a?.tokenNumber ?? 0)
  const tokenB = Number(b?.tokenNumber ?? 0)
  if (tokenA !== tokenB) return tokenA - tokenB
  return Number(a?.id ?? 0) - Number(b?.id ?? 0)
}

export default function ReceptionistDashboard({ user }) {
  const [queueDate, setQueueDate] = useState(getTodayDate())
  const [viewMode, setViewMode] = useState('manage')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async (date) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await getQueue(date)
      setEntries(filterByClinic(asList(res, ['queue', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load queue.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load(queueDate)
  }, [load, queueDate])

  const orderedEntries = useMemo(() => {
    return [...entries].sort(byTokenAsc)
  }, [entries])

  const stats = useMemo(() => {
    const base = {
      total: orderedEntries.length,
      waiting: 0,
      in_progress: 0,
      done: 0,
      skipped: 0,
    }

    for (const entry of orderedEntries) {
      const status = norm(entry?.status)
      if (status in base) base[status] += 1
    }

    return base
  }, [orderedEntries])

  async function updateStatus(id, status, currentStatus) {
    setPendingId(id)
    setError('')
    setSuccess('')
    try {
      await updateQueueStatus(id, status, currentStatus)
      setSuccess('Queue status updated.')
      await load(queueDate)
    } catch (e) {
      setError(extractApiError(e, 'Failed to update status.'))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Card
      title={viewMode === 'tv' ? 'TV Display' : 'Daily Queue'}
      sub={
        viewMode === 'tv'
          ? 'All appointments for the selected date in queue order'
          : 'Manage patient call status for a selected date'
      }
      action={
        <div className="row-gap">
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="manage">Manage Queue</option>
            <option value="tv">TV Display</option>
          </select>
          <input
            type="date"
            value={queueDate}
            onChange={(e) => setQueueDate(e.target.value)}
          />
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => load(queueDate)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      }
    >
      <Alert type="success" msg={success} />
      <Alert type="error" msg={error} />
      {loading ? <p className="muted">Loading\u2026</p> : null}
      {!loading && entries.length === 0 ? (
        <p className="muted">No queue entries for {fmtDate(queueDate)}.</p>
      ) : null}
      {orderedEntries.length > 0 && viewMode === 'manage' ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Token</th>
                <th>Appt. ID</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Patient</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedEntries.map((entry) => {
                const s = norm(entry.status)
                const appointment = entry.appointment || {}
                const patient = appointment.patient || entry.patient || {}
                return (
                  <tr key={entry.id}>
                    <td className="cell-mono">{entry.id ?? '\u2014'}</td>
                    <td>
                      <strong>#{entry.tokenNumber ?? '\u2014'}</strong>
                    </td>
                    <td className="cell-mono">{appointment.id || entry.appointmentId || '\u2014'}</td>
                    <td>{fmtDate(appointment.appointmentDate || entry.appointmentDate || queueDate)}</td>
                    <td>{appointment.timeSlot || entry.timeSlot || '\u2014'}</td>
                    <td className="cell-strong">{patient.name || '\u2014'}</td>
                    <td>{patient.phone || '\u2014'}</td>
                    <td>
                      <Badge status={entry.status} />
                    </td>
                    <td>
                      <div className="actions-inline">
                        {s === 'waiting' ? (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              type="button"
                              disabled={pendingId === entry.id}
                              onClick={() => updateStatus(entry.id, 'in_progress', entry.status)}
                            >
                              In progress
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              type="button"
                              disabled={pendingId === entry.id}
                              onClick={() => updateStatus(entry.id, 'skipped', entry.status)}
                            >
                              Skip
                            </button>
                          </>
                        ) : null}
                        {s === 'in_progress' ? (
                          <button
                            className="btn btn-sm btn-success"
                            type="button"
                            disabled={pendingId === entry.id}
                            onClick={() => updateStatus(entry.id, 'done', entry.status)}
                          >
                            Mark done
                          </button>
                        ) : null}
                        {s !== 'waiting' && s !== 'in_progress' ? (
                          <span className="muted">\u2014</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {orderedEntries.length > 0 && viewMode === 'tv' ? (
        <>
          <div className="tv-metrics">
            <div className="tv-metric">
              <span className="tv-metric-label">Total</span>
              <strong className="tv-metric-value">{stats.total}</strong>
            </div>
            <div className="tv-metric">
              <span className="tv-metric-label">Waiting</span>
              <strong className="tv-metric-value">{stats.waiting}</strong>
            </div>
            <div className="tv-metric">
              <span className="tv-metric-label">In Progress</span>
              <strong className="tv-metric-value">{stats.in_progress}</strong>
            </div>
            <div className="tv-metric">
              <span className="tv-metric-label">Done</span>
              <strong className="tv-metric-value">{stats.done}</strong>
            </div>
            <div className="tv-metric">
              <span className="tv-metric-label">Skipped</span>
              <strong className="tv-metric-value">{stats.skipped}</strong>
            </div>
          </div>

          <div className="table-wrap tv-table-wrap">
            <table className="tv-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Appt. ID</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderedEntries.map((entry) => {
                  const appointment = entry.appointment || {}
                  const patient = appointment.patient || entry.patient || {}

                  return (
                    <tr key={`tv-${entry.id || entry.appointmentId || entry.tokenNumber}`}>
                      <td className="cell-strong">#{entry.tokenNumber ?? '\u2014'}</td>
                      <td className="cell-strong">{patient.name || '\u2014'}</td>
                      <td className="cell-mono">{appointment.id || entry.appointmentId || '\u2014'}</td>
                      <td>{fmtDate(appointment.appointmentDate || entry.appointmentDate || queueDate)}</td>
                      <td>{appointment.timeSlot || entry.timeSlot || '\u2014'}</td>
                      <td>
                        <Badge status={entry.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </Card>
  )
}
