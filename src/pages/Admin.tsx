import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminGate from '../components/admin/AdminGate'
import ColorPanel from '../components/admin/ColorPanel'
import ContentPanel from '../components/admin/ContentPanel'
import TypographyPanel from '../components/admin/TypographyPanel'
import LayoutPanel from '../components/admin/LayoutPanel'
import SubscribersPanel from '../components/admin/SubscribersPanel'
import CollectionPanel from '../components/admin/CollectionPanel'
import { useAdmin } from '../context/AdminContext'

type Tab = 'colors' | 'content' | 'typography' | 'layout' | 'collections' | 'subscribers'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'colors',      label: 'Colors',      icon: '🎨' },
  { id: 'content',     label: 'Content',     icon: '📝' },
  { id: 'typography',  label: 'Typography',  icon: '🔤' },
  { id: 'layout',      label: 'Layout',      icon: '📐' },
  { id: 'collections', label: 'Collections', icon: '📁' },
  { id: 'subscribers', label: 'Subscribers', icon: '📧' },
]

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('colors')
  const { resetSettings, logout, dbConnected } = useAdmin()

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) resetSettings()
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">⚙️ Admin</span>
          <span className={`admin-db-badge${dbConnected ? ' connected' : ''}`}>
            {dbConnected ? '🟢 MongoDB' : '🔴 No DB'}
          </span>
          <Link to="/" className="admin-view-site-btn">← View Site</Link>
        </div>

        <nav className="admin-nav">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`admin-nav-btn${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="admin-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-reset-btn" onClick={handleReset}>
            ↺ Reset to Defaults
          </button>
          <button className="admin-logout-btn" onClick={logout}>
            🔓 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">
        {activeTab === 'colors'      && <ColorPanel />}
        {activeTab === 'content'     && <ContentPanel />}
        {activeTab === 'typography'  && <TypographyPanel />}
        {activeTab === 'layout'      && <LayoutPanel />}
        {activeTab === 'collections' && <CollectionPanel />}
        {activeTab === 'subscribers' && <SubscribersPanel />}
      </main>
    </div>
  )
}

export default function Admin() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  )
}
