import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

interface BookItem {
  _id: string
  title: string
  category: string
  desc: string
  pages: string
  year: string
  img: string
  isCurrent: boolean
}

export default function Books() {
  const { settings } = useAdmin()
  const [books, setBooks] = useState<BookItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/books')
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

  const searchLower = search.toLowerCase()
  const allFiltered = search
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(searchLower) ||
          b.category.toLowerCase().includes(searchLower) ||
          (b.desc || '').toLowerCase().includes(searchLower)
      )
    : books

  const currentBook = search ? null : books.find((b) => b.isCurrent)
  const remainingBooks = search
    ? allFiltered
    : allFiltered.filter((b) => !b.isCurrent)

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

        {/* Search bar */}
        <div className="games-toolbar" style={{ marginBottom: '32px' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '400px', width: '100%' }}>
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

        {/* Current Reads */}
        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading books...</p>
        ) : (
          <section>
            <div className="books-section-header">
              <span className="books-section-num">01</span>
              <span className="books-section-title">Library Index</span>
              <div className="books-section-line" />
            </div>

            <div className="books-bento">
              {/* Feature */}
              {currentBook ? (
                <article className="book-feature-card">
                  <div
                    className="book-feature-img"
                    style={{ backgroundImage: `url('${currentBook.img}')` }}
                  />
                  <div className="book-feature-body">
                    <span className="book-feature-category">{currentBook.category}</span>
                    <h2 className="book-feature-title">{currentBook.title}</h2>
                    <p className="book-feature-desc">{currentBook.desc}</p>
                    <div className="book-feature-stats">
                      {currentBook.pages && (
                        <span className="book-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                          {currentBook.pages} pages
                        </span>
                      )}
                      {currentBook.year && (
                        <span className="book-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {currentBook.year}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ) : (
                <div className="book-feature-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <p className="admin-empty">No book marked as "Currently Reading".</p>
                </div>
              )}

              {/* Mini cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {remainingBooks.map((book) => (
                  <article key={book._id} className="book-mini-card">
                    <span className="book-mini-category">{book.category}</span>
                    <h3 className="book-mini-title">{book.title}</h3>
                    <p className="book-mini-desc">{book.desc}</p>
                  </article>
                ))}
                {remainingBooks.length === 0 && (
                  <p className="admin-empty">
                    {search ? `No books matching "${search}".` : 'No archived books.'}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
