import { norm } from '../../utils/status'
import Badge from '../shared/Badge'

export default function Topbar({ user, onLogout }) {
  const role = norm(user.role)
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <svg
          className="topbar-icon"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" rx="12" fill="#0f766e" />
          <path
            d="M24 12v24M12 24h24"
            stroke="#fff"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        </svg>
        <div>
          <p className="topbar-clinic">
            {user.clinicName || 'Clinic'} &middot; {user.clinicCode || ''}
          </p>
          <p className="topbar-name">{user.name || user.email}</p>
        </div>
      </div>
      <div className="topbar-right">
        <Badge status={role} />
        <button className="btn btn-ghost btn-sm" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
