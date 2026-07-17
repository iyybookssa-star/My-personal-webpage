import { useAdmin } from '../../context/AdminContext'

const RADIUS_PRESETS = [
  { label: 'Sharp',    value: '0' },
  { label: 'Subtle',   value: '0.125' },
  { label: 'Default',  value: '0.25' },
  { label: 'Rounded',  value: '0.75' },
  { label: 'Pill',     value: '1.5' },
]

const GAP_PRESETS = [
  { label: 'Compact', value: '60' },
  { label: 'Default', value: '120' },
  { label: 'Spacious', value: '180' },
]

export default function LayoutPanel() {
  const { settings, updateSetting } = useAdmin()

  const handleRadius = (value: string) => {
    updateSetting('borderRadius', value)
    document.documentElement.style.setProperty('--radius', `${value}rem`)
  }

  const handleGap = (value: string) => {
    updateSetting('sectionGap', value)
    document.documentElement.style.setProperty('--section-gap', `${value}px`)
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Layout & Shapes</h2>
        <p>Control spacing, roundness, and display style</p>
      </div>

      {/* Border Radius */}
      <div className="admin-section">
        <h3 className="admin-section-title">Card Corner Radius</h3>
        <div className="layout-presets">
          {RADIUS_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`layout-preset-btn${settings.borderRadius === p.value ? ' active' : ''}`}
              onClick={() => handleRadius(p.value)}
            >
              <div
                className="radius-preview-box"
                style={{ borderRadius: `${p.value}rem` }}
              />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Fine-grained slider */}
        <div className="slider-field" style={{ marginTop: '24px' }}>
          <div className="slider-label-row">
            <span className="slider-label">Custom radius</span>
            <span className="slider-value">{settings.borderRadius}rem</span>
          </div>
          <input
            type="range"
            className="admin-slider"
            min={0}
            max={2}
            step={0.125}
            value={settings.borderRadius}
            onChange={(e) => handleRadius(e.target.value)}
          />
        </div>
      </div>

      {/* Section gap */}
      <div className="admin-section">
        <h3 className="admin-section-title">Section Spacing</h3>
        <div className="layout-presets">
          {GAP_PRESETS.map((p) => (
            <button
              key={p.label}
              className={`layout-preset-btn${settings.sectionGap === p.value ? ' active' : ''}`}
              onClick={() => handleGap(p.value)}
            >
              <div className="gap-preview" style={{ gap: `${Number(p.value) / 20}px` }}>
                <div className="gap-line" />
                <div className="gap-space" style={{ height: `${Number(p.value) / 20}px` }} />
                <div className="gap-line" />
              </div>
              <span>{p.label}</span>
              <span className="layout-preset-sub">{p.value}px</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card style */}
      <div className="admin-section">
        <h3 className="admin-section-title">Card Display Style</h3>
        <div className="card-style-toggle">
          <button
            className={`card-style-btn${settings.cardStyle === 'grid' ? ' active' : ''}`}
            onClick={() => updateSetting('cardStyle', 'grid')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="8" height="8" rx="1"/>
              <rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/>
              <rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
            Grid
          </button>
          <button
            className={`card-style-btn${settings.cardStyle === 'list' ? ' active' : ''}`}
            onClick={() => updateSetting('cardStyle', 'list')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            List
          </button>
        </div>
      </div>

      {/* Live preview of radius */}
      <div className="admin-section">
        <h3 className="admin-section-title">Shape Preview</h3>
        <div className="shape-preview-row">
          <div className="shape-preview-card" style={{ borderRadius: `${settings.borderRadius}rem` }}>
            <div className="shape-preview-img" style={{ borderRadius: `${settings.borderRadius}rem ${settings.borderRadius}rem 0 0` }} />
            <div className="shape-preview-body">
              <div className="shape-preview-line short" />
              <div className="shape-preview-line" />
              <div className="shape-preview-line medium" />
            </div>
          </div>
          <div className="shape-preview-btn" style={{ borderRadius: `${settings.borderRadius}rem` }}>
            Button
          </div>
        </div>
      </div>
    </div>
  )
}
