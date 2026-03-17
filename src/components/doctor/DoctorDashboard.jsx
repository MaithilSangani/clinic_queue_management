import { useState } from 'react'
import TabNav from '../shared/TabNav'
import DoctorQueue from './DoctorQueue'
import DoctorPrescription from './DoctorPrescription'
import DoctorReport from './DoctorReport'

export default function DoctorDashboard({ user }) {
  const [tab, setTab] = useState('queue')
  const [apptId, setApptId] = useState('')
  const tabs = [
    { id: 'queue', label: "Today's Queue" },
    { id: 'prescription', label: 'Add Prescription' },
    { id: 'report', label: 'Add Report' },
  ]

  function handleSelect(id) {
    setApptId(String(id))
    setTab('prescription')
  }

  return (
    <div className="dash-stack">
      <TabNav tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'queue' ? <DoctorQueue user={user} onSelect={handleSelect} /> : null}
      {tab === 'prescription' ? (
        <DoctorPrescription appointmentId={apptId} onIdChange={setApptId} />
      ) : null}
      {tab === 'report' ? (
        <DoctorReport appointmentId={apptId} onIdChange={setApptId} />
      ) : null}
    </div>
  )
}
