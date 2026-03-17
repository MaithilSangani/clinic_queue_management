import { useCallback, useEffect, useState } from 'react'
import {
  getMyReports,
  getMyAppointments,
  getAppointmentDetails,
  extractApiError,
} from '../../api'
import { asList, asRecord, belongsToClinic, filterByClinic } from '../../utils/data'
import { fmtDateTime } from '../../utils/date'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

async function loadReportsViaAppointments(clinicId) {
  const appointmentsRes = await getMyAppointments()
  const appointments = filterByClinic(asList(appointmentsRes, ['appointments', 'data']), clinicId)
  const ids = appointments
    .map((item) => Number(item?.id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (ids.length === 0) return []

  const details = await Promise.allSettled(ids.map((id) => getAppointmentDetails(id)))
  const reports = []

  for (let i = 0; i < details.length; i += 1) {
    const entry = details[i]
    if (entry.status !== 'fulfilled') continue

    const record = asRecord(entry.value, ['appointment', 'data'])
    if (!record || !belongsToClinic(record, clinicId)) continue

    const report = record.report
    if (!report) continue

    reports.push({
      id: report.id ?? `appointment-${ids[i]}`,
      appointmentId: report.appointmentId ?? record.id ?? ids[i],
      diagnosis: report.diagnosis ?? '',
      testRecommended: report.testRecommended ?? '',
      remarks: report.remarks ?? '',
      createdAt: report.createdAt ?? record.updatedAt ?? record.createdAt ?? '',
    })
  }

  return reports
}

export default function PatientReports({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMyReports()
      setItems(filterByClinic(asList(res, ['reports', 'data']), clinicId))
    } catch (e) {
      const status = e?.response?.status
      const apiMessage = String(e?.response?.data?.error || e?.response?.data?.message || '')
      const isForbiddenRole = status === 403 && apiMessage.toLowerCase().includes('role not allowed')

      if (isForbiddenRole) {
        try {
          const fallbackItems = await loadReportsViaAppointments(clinicId)
          setItems(fallbackItems)
          if (fallbackItems.length === 0) {
            setError('No reports found for your appointments.')
          }
          return
        } catch (fallbackError) {
          setError(extractApiError(fallbackError, 'Failed to load reports.'))
          return
        }
      }

      setError(extractApiError(e, 'Failed to load reports.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card
      title="My Reports"
      sub="Diagnosis reports from your doctor"
      action={
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      }
    >
      {loading ? <p className="muted">Loading\u2026</p> : null}
      <Alert type="error" msg={error} />
      {!loading && items.length === 0 ? <p className="muted">No reports yet.</p> : null}
      {items.length > 0 ? (
        <div className="record-stack">
          {items.map((r) => (
            <div className="record-item" key={r.id || r.appointmentId}>
              <div className="record-meta">
                <span>Appointment #{r.appointmentId ?? '\u2014'}</span>
                <span>{fmtDateTime(r.createdAt)}</span>
              </div>
              <dl className="dl">
                <dt>Diagnosis</dt>
                <dd>{r.diagnosis || '\u2014'}</dd>
                <dt>Tests</dt>
                <dd>{r.testRecommended || '\u2014'}</dd>
                <dt>Remarks</dt>
                <dd>{r.remarks || '\u2014'}</dd>
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
