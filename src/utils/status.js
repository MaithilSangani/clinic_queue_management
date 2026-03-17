export function norm(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_')
}

export function statusLabel(status) {
  const n = norm(status)
  if (!n) return 'Unknown'
  return n
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function toApiStatus(status) {
  return norm(status) === 'in_progress' ? 'in-progress' : norm(status)
}
