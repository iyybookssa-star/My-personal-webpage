import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

interface GameItem {
  _id: string
  title: string
  year: string
  studio: string
  rating: number
  category: string
  desc: string
  img: string
  order: number
}

const TABS = ['All', 'Played', 'Recently Played', 'Backlog', 'Favorites']

export default function Games() {
  const { settings } = useAdmin()
  const [games, setGames] = useState<GameItem[]>([])
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null)

  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then((data) => {
        setGames(data)
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
        setSelectedGame(null)
      }
    }
    if (selectedGame) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedGame])

  const filtered = games.filter((g) => {
    const matchTab = activeTab === 'All' || g.category === activeTab
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <main className="page-main">
      <header className="page-header-full">
        <div className="container">
          {/* Hero */}
          <section className="page-hero">
            <h1>{settings.gamesPageTitle}</h1>
            <p className="page-hero-desc">{settings.gamesPageDesc}</p>
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
              id="game-search"
              className="search-input"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Game Grid (Matches Film Grid) */}
        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading games...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty" style={{ textAlign: 'center' }}>
            {search ? `No games matching "${search}".` : 'No items in this category yet.'}
          </p>
        ) : (
          <div className="film-grid">
            {filtered.map((game) => (
              <article key={game._id} className="film-card" onClick={() => setSelectedGame(game)}>
                <div
                  className="film-card-img"
                  style={{ backgroundImage: `url('${game.img}')` }}
                />
                <div className="film-card-overlay">
                  <div className="film-card-title">{game.title}</div>
                  <div className="film-card-year">{game.year}</div>
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

      {/* Game Poster Lightbox Modal */}
      <div 
        className={`poster-lightbox${selectedGame ? ' active' : ''}`}
        onClick={() => setSelectedGame(null)}
      >
        {selectedGame && (
          <div className="poster-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedGame.img} 
              alt={selectedGame.title} 
              className="poster-lightbox-img"
            />
            <div className="poster-lightbox-info">
              <h3 className="poster-lightbox-title">{selectedGame.title}</h3>
              <p className="poster-lightbox-meta">
                {selectedGame.studio && selectedGame.studio !== 'N/A'
                  ? `${selectedGame.studio} (${selectedGame.year})`
                  : selectedGame.year} • {selectedGame.category}
              </p>
            </div>
          </div>
        )}
        <button 
          className="poster-lightbox-close" 
          onClick={() => setSelectedGame(null)}
          aria-label="Close lightbox"
        >
          ×
        </button>
      </div>
    </main>
  )
}
