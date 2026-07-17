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

const TABS = ['All', 'Recently Played', 'Backlog', 'Favorites']

export default function Games() {
  const { settings } = useAdmin()
  const [games, setGames] = useState<GameItem[]>([])
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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
            <span className="page-hero-label">{settings.heroLabel}</span>
            <h1>{settings.gamesPageTitle}</h1>
            <p className="page-hero-desc">{settings.gamesPageDesc}</p>
          </section>
        </div>
      </header>

      <div className="container">

        {/* Toolbar */}
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
              className="search-input"
              placeholder="Search archive..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading games...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty" style={{ textAlign: 'center' }}>No items match your query.</p>
        ) : (
          <div className="games-grid">
            {filtered.map((game) => (
              <article key={game._id} className="game-card">
                <div className="game-card-img" style={{ position: 'relative' }}>
                  <img src={game.img} alt={game.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                  <div className="game-card-rating">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {game.rating}
                  </div>
                </div>
                <div className="game-card-body">
                  <div className="game-card-header">
                    <div className="game-card-title">{game.title}</div>
                    <div className="game-card-year">{game.year}</div>
                  </div>
                  <div className="game-card-studio">{game.studio}</div>
                  <p className="game-card-desc">{game.desc}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Quote block */}
        <div className="curator-quote-block">
          <span className="curator-quote-mark">"</span>
          <p className="curator-quote-text">
            "The archive is not merely a list of titles, but a map of spaces inhabited. Each
            entry represents a distinct set of rules learned, a specific atmosphere breathed,
            and hours surrendered to the design of another."
          </p>
          <span className="curator-quote-attr">— The Curator</span>
        </div>

      </div>
    </main>
  )
}
