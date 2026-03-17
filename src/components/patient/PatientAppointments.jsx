import { useCallback, useEffect, useState } from 'react'
import { getMyAppointments, getAppointmentDetails, extractApiError } from '../../api'
import { asList, asRecord, belongsToClinic, filterByClinic } from '../../utils/data'
import { fmtDate } from '../../utils/date'
import { norm } from '../../utils/status'
import Card from '../shared/Card'
import Alert from '../shared/Alert'
import Badge from '../shared/Badge'

function resolveDisplayStatus(appointmentStatus, queueStatus) {
  const queue = norm(queueStatus)
  if (queue === 'done') return 'done'
  if (queue === 'in_progress') return 'in_progress'
  if (queue === 'waiting') return 'waiting'
  if (queue === 'skipped') return 'skipped'
  return appointmentStatus
}

export default function PatientAppointments({ user }) {
  const [appointments, setAppointments] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''
  const selectedQueueStatus = selected?.queueEntry?.status || selected?.queueStatus || ''
  const selectedDisplayStatus = selected
    ? resolveDisplayStatus(selected.status, selectedQueueStatus)
    : ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMyAppointments()
      setAppointments(filterByClinic(asList(res, ['appointments', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load appointments.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  async function viewDetails(id) {
    setDetailLoading(true)
    setError('')
    try {
      const res = await getAppointmentDetails(id)
      const record = asRecord(res, ['appointment', 'data'])
      if (!belongsToClinic(record, clinicId)) {
        setSelected(null)
        setError('This appointment is outside your clinic access.')
        return
      }
      setSelected(record)
    } catch (e) {
      setError(extractApiError(e, 'Failed to load details.'))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="dash-stack">
      <Card
        title="My Appointments"
        sub="Your queue token and appointment status"
        action={
          <div className="table-toolbar">
            <span className="table-meta">{appointments.length} appointments</span>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>
        }
      >
        {loading ? <p className="muted">Loading\u2026</p> : null}
        <Alert type="error" msg={error} />
        {!loading && appointments.length === 0 ? (
          <p className="muted">No appointments yet. Book one to get started.</p>
        ) : null}
        {appointments.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Appt. ID</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Queue Token</th>
                  <th>Queue Status</th>
                  <th>Appointment Status</th>
                  <th>Prescription</th>
                  <th>Report</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const queueStatus = a.queueEntry?.status || a.queueStatus || ''
                  const displayStatus = resolveDisplayStatus(a.status, queueStatus)
                  const hasPrescription = Boolean(
                    a.prescription || a.prescriptionId || a.hasPrescription,
                  )
                  const hasReport = Boolean(a.report || a.reportId || a.hasReport)

                  return (
                    <tr key={a.id}>
                      <td className="cell-mono">{a.id ?? '\u2014'}</td>
                      <td>{fmtDate(a.appointmentDate)}</td>
                      <td>{a.timeSlot || '\u2014'}</td>
                      <td>
                        {a.queueEntry?.tokenNumber != null
                          ? <strong>#{a.queueEntry.tokenNumber}</strong>
                          : '\u2014'}
                      </td>
                      <td>
                        {queueStatus
                          ? <Badge status={queueStatus} />
                          : <span className="muted">\u2014</span>}
                      </td>
                      <td>
                        <Badge status={displayStatus} />
                      </td>
                      <td>{hasPrescription ? 'Available' : 'Pending'}</td>
                      <td>{hasReport ? 'Available' : 'Pending'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-ghost"
                          type="button"
                          onClick={() => viewDetails(a.id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
      {detailLoading ? <p className="muted">Loading details\u2026</p> : null}
      {selected ? (
        <Card
          title="Appointment Details"
          sub={`Date: ${fmtDate(selected.appointmentDate)} \u00b7 Slot: ${selected.timeSlot || '\u2014'}`}
        >
          <div className="detail-grid">
            <div className="detail-block">
              <h3 className="detail-heading">Appointment</h3>
              <dl className="dl">
                <dt>Appointment Status</dt>
                <dd>
                  <Badge status={selectedDisplayStatus} />
                </dd>
                <dt>Queue Status</dt>
                <dd>
                  {selectedQueueStatus ? <Badge status={selectedQueueStatus} /> : '\u2014'}
                </dd>
                <dt>Queue Token</dt>
                <dd>
                  {selected.queueEntry?.tokenNumber != null
                    ? `#${selected.queueEntry.tokenNumber}`
                    : '\u2014'}
                </dd>
              </dl>
            </div>
            <div className="detail-block">
              <h3 className="detail-heading">Prescription</h3>
              {selected.prescription ? (
                <>
                  <ul className="med-list">
                    {asList(selected.prescription.medicines, ['data']).map((m, i) => (
                      <li key={`${m.name}-${i}`}>
                        <strong>{m.name}</strong> \u00b7 {m.dosage} \u00b7 {m.duration}
                      </li>
                    ))}
                  </ul>
                  {selected.prescription.notes ? (
                    <p className="notes-line">Notes: {selected.prescription.notes}</p>
                  ) : null}
                </>
              ) : (
                <p className="muted">No prescription yet.</p>
              )}
            </div>
            <div className="detail-block">
              <h3 className="detail-heading">Report</h3>
              {selected.report ? (
                <dl className="dl">
                  <dt>Diagnosis</dt>
                  <dd>{selected.report.diagnosis}</dd>
                  <dt>Tests</dt>
                  <dd>{selected.report.testRecommended || '\u2014'}</dd>
                  <dt>Remarks</dt>
                  <dd>{selected.report.remarks || '\u2014'}</dd>
                </dl>
              ) : (
                <p className="muted">No report yet.</p>
              )}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
