import { useState } from 'react'
import { bookAppointment, extractApiError } from '../../api'
import { getTodayDate } from '../../utils/date'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

export default function PatientBooking() {
  const [date, setDate] = useState(getTodayDate())
  const [slot, setSlot] = useState('10:00-10:15')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await bookAppointment({ appointmentDate: date, timeSlot: slot.trim() })
      setSuccess('Appointment booked. Check My Appointments for your queue token.')
    } catch (e) {
      setError(extractApiError(e, 'Failed to book appointment.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Book Appointment" sub="Pick a date and an available time slot">
      <form className="form-grid two-col" onSubmit={handleSubmit}>
        <label className="field">
          Appointment date
          <input
            type="date"
            value={date}
            min={getTodayDate()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Time slot
          <input
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            required
            placeholder="10:00-10:15"
          />
        </label>
        <div className="field align-end">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Booking\u2026' : 'Book appointment'}
          </button>
        </div>
      </form>
      <Alert type="success" msg={success} />
      <Alert type="error" msg={error} />
    </Card>
  )
}
