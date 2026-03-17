export function getTodayDate() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0]
}

export function fmtDate(val) {
  if (!val) return '\u2014'
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString()
}

export function fmtDateTime(val) {
  if (!val) return '\u2014'
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleString()
}
