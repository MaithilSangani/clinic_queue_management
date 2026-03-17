import { useState } from 'react'
import { createUser, extractApiError } from '../../api'
import { INITIAL_ADMIN_FORM, ROLE_LABELS } from '../../constants'
import Card from '../shared/Card'
import Alert from '../shared/Alert'

export default function AdminCreateUser() {
  const [form, setForm] = useState(INITIAL_ADMIN_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setField(field, val) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: form.role,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      })
      setSuccess(`${ROLE_LABELS[form.role] || 'User'} created successfully.`)
      setForm(INITIAL_ADMIN_FORM)
    } catch (e) {
      setError(extractApiError(e, 'Failed to create user.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Create User" sub="Add a doctor, receptionist, or patient to your clinic">
      <form className="form-grid two-col" onSubmit={handleSubmit}>
        <label className="field">
          Full name
          <input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            minLength={3}
            placeholder="Jane Doe"
          />
        </label>
        <label className="field">
          Email address
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            required
            placeholder="jane@clinic.local"
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            required
            minLength={6}
            placeholder="Min. 6 characters"
          />
        </label>
        <label className="field">
          Role
          <select value={form.role} onChange={(e) => setField('role', e.target.value)}>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="patient">Patient</option>
          </select>
        </label>
        <label className="field">
          Phone (optional)
          <input
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="9876543210"
          />
        </label>
        <div className="field align-end">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating\u2026' : 'Create user'}
          </button>
        </div>
      </form>
      <Alert type="success" msg={success} />
      <Alert type="error" msg={error} />
    </Card>
  )
}
