import { norm, statusLabel } from '../../utils/status'

export default function Badge({ status }) {
  const n = norm(status)
  return (
    <span className={`badge badge-${n || 'default'}`}>{statusLabel(status)}</span>
  )
}
