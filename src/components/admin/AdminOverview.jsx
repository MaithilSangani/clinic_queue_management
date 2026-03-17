import { useCallback, useEffect, useMemo, useState } from 'react'
import { getClinicInfo, getUsers, extractApiError } from '../../api'
import { norm } from '../../utils/status'
import { asList, asRecord, filterByClinic } from '../../utils/data'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

export default function AdminOverview({ user }) {
  const [clinic, setClinic] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [cr, ur] = await Promise.all([getClinicInfo(), getUsers()])
      setClinic(asRecord(cr, ['clinic', 'data']))
      setUsers(filterByClinic(asList(ur, ['users', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load clinic data.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c = { total: users.length, doctor: 0, receptionist: 0, patient: 0 }
    for (const u of users) {
      const r = norm(u.role)
      if (r in c) c[r]++
    }
    return c
  }, [users])

  return (
    <Card
      title="Clinic Overview"
      sub="Live statistics for your clinic"
      action={
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      }
    >
      {loading ? <p className="muted">Loading\u2026</p> : null}
      <Alert type="error" msg={error} />
      {clinic ? (
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-label">Clinic</span>
            <span className="metric-value">{clinic.name || '\u2014'}</span>
            <span className="metric-sub">{clinic.code || clinic.clinicCode || '\u2014'}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Appointments</span>
            <span className="metric-value">{clinic.appointmentCount ?? '\u2014'}</span>
            <span className="metric-sub">Total booked</span>
          </div>
          <div className="metric">
            <span className="metric-label">Queue Entries</span>
            <span className="metric-value">{clinic.queueCount ?? '\u2014'}</span>
            <span className="metric-sub">All time</span>
          </div>
          <div className="metric">
            <span className="metric-label">Doctors</span>
            <span className="metric-value">{counts.doctor}</span>
            <span className="metric-sub">Medical staff</span>
          </div>
          <div className="metric">
            <span className="metric-label">Receptionists</span>
            <span className="metric-value">{counts.receptionist}</span>
            <span className="metric-sub">Front desk</span>
          </div>
          <div className="metric">
            <span className="metric-label">Patients</span>
            <span className="metric-value">{counts.patient}</span>
            <span className="metric-sub">Registered</span>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
