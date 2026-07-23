import { useAdmin } from '../../context/AdminContext'
import type { AdminSettings } from '../../context/AdminContext'

interface Field {
  key: keyof AdminSettings
  label: string
  multiline?: boolean
  placeholder?: string
}

const SITE_FIELDS: Field[] = [
  { key: 'siteTitle',  label: 'Site Name',     placeholder: 'The Curator' },
  { key: 'footerCopy', label: 'Footer Text',    placeholder: '© 2024 Digital Curator Archive' },
]

const HOME_FIELDS: Field[] = [
  { key: 'heroLabel',    label: 'Hero Label',       placeholder: 'Archive 01' },
  { key: 'heroTitle',    label: 'Hero Heading',     placeholder: 'A curated space...' },
  { key: 'heroSubtitle', label: 'Hero Description', placeholder: 'Documenting thoughts...', multiline: true },
  { key: 'watchingTitle', label: '"Currently Watching" Title', placeholder: 'Currently Watching' },
  { key: 'libraryTitle',  label: '"In the Library" Title',     placeholder: 'In the Library' },
  { key: 'thoughtsTitle', label: '"Recent Thoughts" Title',    placeholder: 'Recent Thoughts' },
]

const PAGE_FIELDS: Field[] = [
  { key: 'filmPageTitle',    label: 'Film Page Title',       placeholder: 'Film Archive' },
  { key: 'filmPageDesc',     label: 'Film Page Description', placeholder: 'An archival record...', multiline: true },
  { key: 'gamesPageTitle',   label: 'Games Page Title',      placeholder: 'Games Archive' },
  { key: 'gamesPageDesc',    label: 'Games Page Description', placeholder: 'A meticulous catalog...', multiline: true },
  { key: 'booksPageTitle',   label: 'Books Page Title',      placeholder: 'The Library' },
  { key: 'booksPageDesc',    label: 'Books Page Description', placeholder: 'A curated collection...', multiline: true },
  { key: 'journalPageTitle', label: 'Journal Page Title',    placeholder: 'Notes from the Archive' },
  { key: 'journalPageDesc',  label: 'Journal Page Description', placeholder: 'A collection of thoughts...', multiline: true },
]

function FieldGroup({ title, fields }: { title: string; fields: Field[] }) {
  const { settings, updateSetting } = useAdmin()
  return (
    <div className="admin-section">
      <h3 className="admin-section-title">{title}</h3>
      <div className="content-fields">
        {fields.map(({ key, label, multiline, placeholder }) => (
          <div key={key} className="content-field">
            <label className="content-field-label">{label}</label>
            {multiline ? (
              <textarea
                className="admin-textarea"
                value={settings[key] as string}
                onChange={(e) => updateSetting(key, e.target.value as any)}
                placeholder={placeholder}
                rows={3}
              />
            ) : (
              <input
                type="text"
                className="admin-input"
                value={settings[key] as string}
                onChange={(e) => updateSetting(key, e.target.value as any)}
                placeholder={placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ContentPanel() {
  const { visits, resetVisits } = useAdmin()

  const handleResetVisits = async () => {
    if (window.confirm(`Are you sure you want to reset site visits counter (${visits}) to 0?`)) {
      await resetVisits()
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Content Editor</h2>
        <p>Edit all text content across your site</p>
      </div>

      {/* Analytics Card */}
      <div className="admin-section">
        <h3 className="admin-section-title">📊 Site Analytics & Counter</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
          <div>
            <span style={{ display: 'block', fontSize: '13px', color: '#a9a9b3' }}>Total Site Visits</span>
            <span style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff' }}>{visits}</span>
          </div>
          <button
            className="admin-btn"
            onClick={handleResetVisits}
            style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}
          >
            🔄 Reset Visits to 0
          </button>
        </div>
      </div>

      <FieldGroup title="Site-wide" fields={SITE_FIELDS} />
      <FieldGroup title="Home Page" fields={HOME_FIELDS} />
      <FieldGroup title="Section Pages" fields={PAGE_FIELDS} />
    </div>
  )
}
