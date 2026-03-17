import { useCallback, useEffect, useState } from 'react'
import { getUsers, extractApiError } from '../../api'
import { asList, filterByClinic } from '../../utils/data'
import { norm } from '../../utils/status'
import Card from '../shared/Card'
import Alert from '../shared/Alert'
import Badge from '../shared/Badge'

export default function AdminUsers({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const clinicId = user?.clinicId ?? user?.clinic?.id ?? ''

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers()
      setUsers(filterByClinic(asList(res, ['users', 'data']), clinicId))
    } catch (e) {
      setError(extractApiError(e, 'Failed to load users.'))
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => {
    load()
  }, [load])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredUsers = users.filter((u) => {
    const roleMatch = role === 'all' || norm(u.role) === role
    if (!roleMatch) return false

    if (!normalizedQuery) return true
    const blob = [u.id, u.name, u.email, u.phone, u.role]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return blob.includes(normalizedQuery)
  })

  return (
    <Card
      title="All Users"
      sub="Every member registered to your clinic"
      action={
        <div className="table-toolbar">
          <span className="table-meta">{filteredUsers.length} users</span>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      }
    >
      <div className="table-filters">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">All roles</option>
          <option value="doctor">Doctor</option>
          <option value="receptionist">Receptionist</option>
          <option value="patient">Patient</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {loading ? <p className="muted">Loading\u2026</p> : null}
      <Alert type="error" msg={error} />
      {!loading && filteredUsers.length === 0 ? (
        <p className="muted">No users found.</p>
      ) : null}
      {filteredUsers.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Clinic</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id || u.email}>
                  <td className="cell-mono">{u.id ?? '\u2014'}</td>
                  <td className="cell-strong">{u.name || '\u2014'}</td>
                  <td>{u.email || '\u2014'}</td>
                  <td>
                    <Badge status={u.role} />
                  </td>
                  <td>{u.phone || '\u2014'}</td>
                  <td>{u.clinic?.name || u.clinicName || user?.clinicName || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  )
}
