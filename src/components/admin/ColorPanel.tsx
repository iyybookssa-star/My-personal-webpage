import { useAdmin } from '../../context/AdminContext'

const COLOR_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: 'accentColor',            label: 'Accent Color',         desc: 'Nav links, borders, buttons, stars' },
  { key: 'backgroundColor',        label: 'Background',           desc: 'Main page background' },
  { key: 'surfaceColor',           label: 'Surface / Cards',      desc: 'Card & section backgrounds' },
  { key: 'onSurfaceColor',         label: 'Primary Text',         desc: 'Headings and main text' },
  { key: 'onSurfaceVariantColor',  label: 'Secondary Text',       desc: 'Descriptions and subtitles' },
  { key: 'secondaryColor',         label: 'Muted Text',           desc: 'Labels, dates, metadata' },
]

const PRESETS = [
  { label: 'Blue',    accent: '#4f81ff', bg: '#141313' },
  { label: 'Amber',   accent: '#ffba20', bg: '#141313' },
  { label: 'Teal',    accent: '#2dd4bf', bg: '#0d1717' },
  { label: 'Rose',    accent: '#fb7185', bg: '#130d0f' },
  { label: 'Violet',  accent: '#a78bfa', bg: '#0f0d1a' },
  { label: 'Emerald', accent: '#34d399', bg: '#0d1510' },
]

export default function ColorPanel() {
  const { settings, updateSetting } = useAdmin()

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Color Customization</h2>
        <p>Changes apply live to the website</p>
      </div>

      {/* Presets */}
      <div className="admin-section">
        <h3 className="admin-section-title">Quick Presets</h3>
        <div className="color-presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className="color-preset-btn"
              style={{ background: p.accent }}
              title={p.label}
              onClick={() => {
                updateSetting('accentColor', p.accent)
                updateSetting('backgroundColor', p.bg)
              }}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual pickers */}
      <div className="admin-section">
        <h3 className="admin-section-title">Individual Colors</h3>
        <div className="color-fields">
          {COLOR_FIELDS.map(({ key, label, desc }) => (
            <div key={key} className="color-field-row">
              <div className="color-field-info">
                <span className="color-field-label">{label}</span>
                <span className="color-field-desc">{desc}</span>
              </div>
              <div className="color-field-control">
                <div
                  className="color-swatch"
                  style={{ background: settings[key as keyof typeof settings] as string }}
                />
                <input
                  type="color"
                  className="color-picker"
                  value={settings[key as keyof typeof settings] as string}
                  onChange={(e) => updateSetting(key as any, e.target.value)}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={settings[key as keyof typeof settings] as string}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateSetting(key as any, v)
                  }}
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
