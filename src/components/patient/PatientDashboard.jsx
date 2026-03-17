import { useState } from 'react'
import TabNav from '../shared/TabNav'
import PatientBooking from './PatientBooking'
import PatientAppointments from './PatientAppointments'
import PatientPrescriptions from './PatientPrescriptions'
import PatientReports from './PatientReports'

export default function PatientDashboard({ user }) {
  const [tab, setTab] = useState('book')
  const tabs = [
    { id: 'book', label: 'Book Appointment' },
    { id: 'appointments', label: 'My Appointments' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'reports', label: 'Reports' },
  ]
  return (
    <div className="dash-stack">
      <TabNav tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'book' ? <PatientBooking /> : null}
      {tab === 'appointments' ? <PatientAppointments user={user} /> : null}
      {tab === 'prescriptions' ? <PatientPrescriptions user={user} /> : null}
      {tab === 'reports' ? <PatientReports user={user} /> : null}
    </div>
  )
}
