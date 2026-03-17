import { useCallback, useEffect, useState } from 'react'
import { getMyPrescriptions, extractApiError } from '../../api'
import { asList, filterByClinic } from '../../utils/data'
import { fmtDateTime } from '../../utils/date'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

export default function PatientPrescriptions({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getMyPrescriptions()
      setItems(filterByClinic(asList(res, ['prescriptions', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load prescriptions.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card
      title="My Prescriptions"
      sub="Prescriptions issued by your doctor"
      action={
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          Refresh
        </button>
      }
    >
      {loading ? <p className="muted">Loading\u2026</p> : null}
      <Alert type="error" msg={error} />
      {!loading && items.length === 0 ? (
        <p className="muted">No prescriptions yet.</p>
      ) : null}
      {items.length > 0 ? (
        <div className="record-stack">
          {items.map((rx) => (
            <div className="record-item" key={rx.id || rx.appointmentId}>
              <div className="record-meta">
                <span>Appointment #{rx.appointmentId ?? '\u2014'}</span>
                <span>{fmtDateTime(rx.createdAt)}</span>
              </div>
              {rx.medicines && rx.medicines.length > 0 ? (
                <ul className="med-list">
                  {rx.medicines.map((m, i) => (
                    <li key={`${m.name}-${i}`}>
                      <strong>{m.name}</strong> \u00b7 {m.dosage} \u00b7 {m.duration}
                    </li>
                  ))}
                </ul>
              ) : null}
              {rx.notes ? <p className="record-notes">{rx.notes}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
