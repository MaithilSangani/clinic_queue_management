import { norm } from '../../utils/status'
import { ROLE_LABELS } from '../../constants'
import AdminDashboard from '../admin/AdminDashboard'
import PatientDashboard from '../patient/PatientDashboard'
import ReceptionistDashboard from '../receptionist/ReceptionistDashboard'
import DoctorDashboard from '../doctor/DoctorDashboard'
import Topbar from './Topbar'
import Card from '../shared/Card'

export default function Dashboard({ session, onLogout }) {
  const { user } = session
  const role = norm(user.role)
  return (
    <div className="app-wrap">
      <Topbar user={user} onLogout={onLogout} />
      <main className="app-main">
        {role === 'admin' ? <AdminDashboard user={user} /> : null}
        {role === 'patient' ? <PatientDashboard user={user} /> : null}
        {role === 'receptionist' ? <ReceptionistDashboard user={user} /> : null}
        {role === 'doctor' ? <DoctorDashboard user={user} /> : null}
        {!(role in ROLE_LABELS) ? (
          <Card title="Access Denied" sub="This role has no configured interface">
            <p className="muted">Contact your clinic administrator.</p>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
