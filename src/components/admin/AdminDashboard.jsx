import { useState } from 'react'
import TabNav from '../shared/TabNav'
import AdminOverview from './AdminOverview'
import AdminUsers from './AdminUsers'
import AdminCreateUser from './AdminCreateUser'

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('overview')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'create', label: 'Create User' },
  ]
  return (
    <div className="dash-stack">
      <TabNav tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'overview' ? <AdminOverview user={user} /> : null}
      {tab === 'users' ? <AdminUsers user={user} /> : null}
      {tab === 'create' ? <AdminCreateUser /> : null}
    </div>
  )
}
