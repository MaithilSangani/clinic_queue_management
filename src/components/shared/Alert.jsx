export default function Alert({ type, msg }) {
  if (!msg) return null
  return <p className={`alert alert-${type}`}>{msg}</p>
}
