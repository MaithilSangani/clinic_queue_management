import { useState } from 'react'
import { addPrescription, extractApiError } from '../../api'
import { INITIAL_MEDICINE } from '../../constants'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

export default function DoctorPrescription({ appointmentId, onIdChange }) {
  const [medicines, setMedicines] = useState([{ ...INITIAL_MEDICINE }])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateMed(i, field, val) {
    setMedicines((list) =>
      list.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)),
    )
  }

  function addMed() {
    setMedicines((list) => [...list, { ...INITIAL_MEDICINE }])
  }

  function removeMed(i) {
    if (medicines.length === 1) return
    setMedicines((list) => list.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const id = Number(appointmentId)
    if (!id) {
      setError('Enter a valid appointment ID.')
      return
    }
    const meds = medicines
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage.trim(),
        duration: m.duration.trim(),
      }))
      .filter((m) => m.name && m.dosage && m.duration)
    if (meds.length === 0) {
      setError('Add at least one complete medicine row.')
      return
    }
    setLoading(true)
    try {
      await addPrescription(id, { medicines: meds, notes: notes.trim() })
      setSuccess('Prescription saved successfully.')
      setMedicines([{ ...INITIAL_MEDICINE }])
      setNotes('')
    } catch (e) {
      setError(extractApiError(e, 'Failed to save prescription.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Add Prescription" sub="One prescription per appointment">
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
        <div className="med-stack">
          {medicines.map((m, i) => (
            <div className="med-row" key={`med-${i}`}>
              <label className="field">
                Medicine name
                <input
                  value={m.name}
                  onChange={(e) => updateMed(i, 'name', e.target.value)}
                  required
                  placeholder="Paracetamol"
                />
              </label>
              <label className="field">
                Dosage
                <input
                  value={m.dosage}
                  onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                  required
                  placeholder="500mg"
                />
              </label>
              <label className="field">
                Duration
                <input
                  value={m.duration}
                  onChange={(e) => updateMed(i, 'duration', e.target.value)}
                  required
                  placeholder="5 days"
                />
              </label>
              <div className="field align-end">
                <button
                  className="btn btn-sm btn-danger"
                  type="button"
                  onClick={() => removeMed(i)}
                  disabled={medicines.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" type="button" onClick={addMed}>
            + Add medicine
          </button>
        </div>
        <label className="field">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="After food"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving\u2026' : 'Save prescription'}
        </button>
      </form>
      <Alert type="success" msg={success} />
      <Alert type="error" msg={error} />
    </Card>
  )
}
