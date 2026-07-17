import { useAdmin } from '../../context/AdminContext'

const HEADING_FONTS = [
  'Playfair Display',
  'Georgia',
  'Merriweather',
  'Lora',
  'EB Garamond',
]

const BODY_FONTS = [
  'Hanken Grotesk',
  'Inter',
  'DM Sans',
  'Nunito',
  'Source Sans 3',
]

interface SliderField {
  key: 'displayFontSize' | 'headlineFontSize' | 'bodyFontSize'
  label: string
  min: number
  max: number
  unit: string
}

const SLIDERS: SliderField[] = [
  { key: 'displayFontSize',  label: 'Display / Hero Size', min: 32, max: 96, unit: 'px' },
  { key: 'headlineFontSize', label: 'Headline Size',        min: 20, max: 56, unit: 'px' },
  { key: 'bodyFontSize',     label: 'Body Text Size',       min: 12, max: 22, unit: 'px' },
]

export default function TypographyPanel() {
  const { settings, updateSetting } = useAdmin()

  // Inject Google Fonts dynamically when font changes
  const injectFont = (font: string) => {
    const id = `gf-${font.replace(/\s/g, '-')}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;600;700&display=swap`
      document.head.appendChild(link)
    }
  }

  const handleHeadingFont = (font: string) => {
    injectFont(font)
    updateSetting('headingFont', font)
    document.documentElement.style.setProperty('--font-heading', `'${font}', serif`)
  }

  const handleBodyFont = (font: string) => {
    injectFont(font)
    updateSetting('bodyFont', font)
    document.documentElement.style.setProperty('--font-body', `'${font}', sans-serif`)
  }

  const handleFontSize = (key: SliderField['key'], value: number) => {
    updateSetting(key, value)
    const varMap: Record<SliderField['key'], string> = {
      displayFontSize:  '--font-size-display',
      headlineFontSize: '--font-size-headline',
      bodyFontSize:     '--font-size-body',
    }
    document.documentElement.style.setProperty(varMap[key], `${value}px`)
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Typography</h2>
        <p>Adjust fonts and sizes across the site</p>
      </div>

      {/* Font family */}
      <div className="admin-section">
        <h3 className="admin-section-title">Heading Font</h3>
        <div className="font-grid">
          {HEADING_FONTS.map((f) => (
            <button
              key={f}
              className={`font-btn${settings.headingFont === f ? ' active' : ''}`}
              style={{ fontFamily: `'${f}', serif` }}
              onClick={() => handleHeadingFont(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">Body Font</h3>
        <div className="font-grid">
          {BODY_FONTS.map((f) => (
            <button
              key={f}
              className={`font-btn${settings.bodyFont === f ? ' active' : ''}`}
              style={{ fontFamily: `'${f}', sans-serif` }}
              onClick={() => handleBodyFont(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Size sliders */}
      <div className="admin-section">
        <h3 className="admin-section-title">Font Sizes</h3>
        {SLIDERS.map(({ key, label, min, max, unit }) => (
          <div key={key} className="slider-field">
            <div className="slider-label-row">
              <span className="slider-label">{label}</span>
              <span className="slider-value">{settings[key]}{unit}</span>
            </div>
            <input
              type="range"
              className="admin-slider"
              min={min}
              max={max}
              value={settings[key]}
              onChange={(e) => handleFontSize(key, Number(e.target.value))}
            />
            <div className="slider-range-labels">
              <span>{min}{unit}</span>
              <span>{max}{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="admin-section">
        <h3 className="admin-section-title">Preview</h3>
        <div className="typography-preview">
          <p style={{ fontFamily: `'${settings.headingFont}', serif`, fontSize: `${Math.round(settings.displayFontSize * 0.5)}px`, fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1.2 }}>
            The Curator
          </p>
          <p style={{ fontFamily: `'${settings.headingFont}', serif`, fontSize: `${Math.round(settings.headlineFontSize * 0.8)}px`, fontWeight: 600, color: 'var(--on-surface)', marginTop: '8px' }}>
            A curated space
          </p>
          <p style={{ fontFamily: `'${settings.bodyFont}', sans-serif`, fontSize: `${settings.bodyFontSize}px`, color: 'var(--on-surface-variant)', marginTop: '8px', lineHeight: 1.6 }}>
            Documenting thoughts on cinema, literature, and digital landscapes.
          </p>
        </div>
      </div>
    </div>
  )
}
