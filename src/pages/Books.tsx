import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

interface BookItem {
  _id: string
  title: string
  category: string
  desc?: string
  pages?: string
  year?: string
  img: string
  isCurrent?: boolean
  order?: number
}

const TABS = ['All Books', 'Currently Reading', 'Favorites', 'Reading List']

export default function Books() {
  const { settings } = useAdmin()
  const [books, setBooks] = useState<BookItem[]>([])
  const [activeTab, setActiveTab] = useState('All Books')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null)

  useEffect(() => {
    fetch('/api/books')
      .then((r) => r.json())
      .then((data) => {
        setBooks(data)
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
        setSelectedBook(null)
      }
    }
    if (selectedBook) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedBook])

  const filtered = books.filter((b) => {
    let matchTab = true
    if (activeTab === 'Currently Reading') {
      matchTab = !!b.isCurrent || b.category === 'Currently Reading'
    } else if (activeTab !== 'All Books') {
      matchTab = b.category === activeTab
    }

    const searchLower = search.toLowerCase()
    const matchSearch =
      b.title.toLowerCase().includes(searchLower) ||
      (b.category && b.category.toLowerCase().includes(searchLower))

    return matchTab && matchSearch
  })

  return (
    <main className="page-main">
      <header className="page-header-full">
        <div className="container">
          {/* Hero */}
          <section className="page-hero">
            <h1>{settings.booksPageTitle}</h1>
            <p className="page-hero-desc">{settings.booksPageDesc}</p>
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
              id="books-search"
              className="search-input"
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Book Grid (Matches Film Grid) */}
        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading books...</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty" style={{ textAlign: 'center' }}>
            {search ? `No books matching "${search}".` : 'No items in this category yet.'}
          </p>
        ) : (
          <div className="film-grid">
            {filtered.map((book) => (
              <article key={book._id} className="film-card" onClick={() => setSelectedBook(book)}>
                <div
                  className="film-card-img"
                  style={{ backgroundImage: `url('${book.img}')` }}
                />
                <div className="film-card-overlay">
                  <div className="film-card-title">{book.title}</div>
                  <div className="film-card-year">
                    {book.year ? book.year : (book.pages ? `${book.pages} pages` : '')}
                  </div>
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

      {/* Book Poster Lightbox Modal */}
      <div 
        className={`poster-lightbox${selectedBook ? ' active' : ''}`}
        onClick={() => setSelectedBook(null)}
      >
        {selectedBook && (
          <div className="poster-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedBook.img} 
              alt={selectedBook.title} 
              className="poster-lightbox-img"
            />
            <div className="poster-lightbox-info">
              <h3 className="poster-lightbox-title">{selectedBook.title}</h3>
              <p className="poster-lightbox-meta">
                {selectedBook.category} {selectedBook.year ? `(${selectedBook.year})` : ''} {selectedBook.pages ? `• ${selectedBook.pages} pages` : ''}
              </p>
            </div>
          </div>
        )}
        <button 
          className="poster-lightbox-close" 
          onClick={() => setSelectedBook(null)}
          aria-label="Close lightbox"
        >
          ×
        </button>
      </div>
    </main>
  )
}
