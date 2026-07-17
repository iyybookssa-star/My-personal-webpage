import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

interface FilmItem {
  _id: string
  title: string
  year: string
  category: string
  img: string
  order: number
}

const TABS = ['All Media', 'Recently Watched', 'Favorites', 'Watchlist']

export default function Film() {
  const { settings } = useAdmin()
  const [films, setFilms] = useState<FilmItem[]>([])
  const [activeTab, setActiveTab] = useState('All Media')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFilm, setSelectedFilm] = useState<FilmItem | null>(null)

  useEffect(() => {
    fetch('/api/films')
      .then((r) => r.json())
      .then((data) => {
        setFilms(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFilm(null)
      }
    }
    if (selectedFilm) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedFilm])

  const filtered = films.filter((f) => {
    const matchTab = activeTab === 'All Media' || f.category === activeTab
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <main className="page-main">
      <header className="page-header-full">
        <div className="container">
          {/* Hero */}
          <section className="page-hero">
            <h1>{settings.filmPageTitle}</h1>
            <p className="page-hero-desc">{settings.filmPageDesc}</p>
          </section>
        </div>
      </header>

      <div className="container">

        {/* Toolbar: Filter Tabs + Search */}
        <div className="games-toolbar">
          <div className="games-filters">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`filter-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="film-search"
              className="search-input"
              placeholder="Search films..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Film Grid */}
        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading films...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty" style={{ textAlign: 'center' }}>
            {search ? `No films matching "${search}".` : 'No items in this category yet.'}
          </p>
        ) : (
          <div className="film-grid">
            {filtered.map((film) => (
              <article key={film._id} className="film-card" onClick={() => setSelectedFilm(film)}>
                <div
                  className="film-card-img"
                  style={{ backgroundImage: `url('${film.img}')` }}
                />
                <div className="film-card-overlay">
                  <div className="film-card-title">{film.title}</div>
                  <div className="film-card-year">{film.year}</div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Scroll hint */}
        <div className="film-scroll-hint">
          <span>Scroll for more</span>
          <svg className="scroll-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>

      </div>

      {/* Poster Lightbox Modal */}
      <div 
        className={`poster-lightbox${selectedFilm ? ' active' : ''}`}
        onClick={() => setSelectedFilm(null)}
      >
        {selectedFilm && (
          <div className="poster-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedFilm.img} 
              alt={selectedFilm.title} 
              className="poster-lightbox-img"
            />
            <div className="poster-lightbox-info">
              <h3 className="poster-lightbox-title">{selectedFilm.title}</h3>
              <p className="poster-lightbox-meta">{selectedFilm.category} — {selectedFilm.year}</p>
            </div>
          </div>
        )}
        <button 
          className="poster-lightbox-close" 
          onClick={() => setSelectedFilm(null)}
          aria-label="Close lightbox"
        >
          ×
        </button>
      </div>
    </main>
  )
}
