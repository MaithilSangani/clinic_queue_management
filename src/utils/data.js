export function asList(payload, keys) {
  if (Array.isArray(payload)) return payload
  for (const k of (keys || [])) {
    if (Array.isArray(payload?.[k])) return payload[k]
  }
  return []
}

export function asRecord(payload, keys) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  for (const k of (keys || [])) {
    const v = payload[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) return v
  }
  return payload
}

function asId(val) {
  if (val == null || val === '') return ''
  return String(val)
}

function readClinicId(obj) {
  if (!obj || typeof obj !== 'object') return ''
  return asId(
    obj.clinicId ??
      obj.clinic?.id ??
      obj.clinic?.clinicId ??
      obj.user?.clinicId ??
      obj.patient?.clinicId ??
      obj.doctor?.clinicId ??
      obj.receptionist?.clinicId,
  )
}

export function extractClinicId(entity) {
  if (!entity || typeof entity !== 'object') return ''

  const direct = readClinicId(entity)
  if (direct) return direct

  const appointmentClinic = readClinicId(entity.appointment)
  if (appointmentClinic) return appointmentClinic

  const queueClinic = readClinicId(entity.queueEntry)
  if (queueClinic) return queueClinic

  const nestedQueueClinic = readClinicId(entity.queueEntry?.appointment)
  if (nestedQueueClinic) return nestedQueueClinic

  return ''
}

export function belongsToClinic(entity, clinicId) {
  const expectedClinicId = asId(clinicId)
  if (!expectedClinicId) return true

  const actualClinicId = extractClinicId(entity)
  return !actualClinicId || actualClinicId === expectedClinicId
}

export function filterByClinic(items, clinicId) {
  const list = Array.isArray(items) ? items : []
  if (!asId(clinicId)) return list
  return list.filter((item) => belongsToClinic(item, clinicId))
}
