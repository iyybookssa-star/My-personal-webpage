import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import StarRating from '../components/StarRating'
import { useAdmin } from '../context/AdminContext'

const FILM_IMG = 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=900&q=80'
const BOOK_IMG = 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=700&q=80'

interface FilmItem {
  _id: string
  title: string
  year: string
  category: string
  img: string
  order: number
}

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

interface JournalItem {
  _id: string
  title: string
  category: string
  date: string
  desc: string
  img: string
  isFeatured: boolean
}

export default function Home() {
  const { settings } = useAdmin()
  const [films, setFilms] = useState<FilmItem[]>([])
  const [books, setBooks] = useState<BookItem[]>([])
  const [journals, setJournals] = useState<JournalItem[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filmsData, booksData, journalsData] = await Promise.all([
          fetch('http://localhost:3001/api/films').then((r) => r.json()),
          fetch('http://localhost:3001/api/books').then((r) => r.json()),
          fetch('http://localhost:3001/api/journals').then((r) => r.json()),
        ])
        if (Array.isArray(filmsData)) setFilms(filmsData)
        if (Array.isArray(booksData)) setBooks(booksData)
        if (Array.isArray(journalsData)) setJournals(journalsData)
      } catch (err) {
        console.error('Error fetching home page data:', err)
      }
    }
    fetchData()
  }, [])

  // Currently Watching (Films)
  const hasFilms = films && films.length > 0
  const featuredFilm = hasFilms ? films[0] : null
  const displaySideFilms = hasFilms
    ? films.slice(1, 3).map((f, idx) => ({
        num: `0${idx + 1} — ${f.category}`,
        title: f.title,
        desc: `Released in ${f.year}`,
        rating: 0,
      }))
    : [
        { num: '01 — Review',   title: 'Echoes of the Past',       desc: 'A retrospective on 90s slow cinema.', rating: 4 },
        { num: '02 — Analysis', title: 'Color Theory in Neo-Noir', desc: 'How neon palettes dictate narrative mood.', rating: 0 },
      ]

  // In the Library (Books)
  const displayBook = books.find((b) => b.isCurrent) || books[0]

  // Recent Thoughts (Journals)
  const displayThoughts = journals && journals.length > 0
    ? journals.slice(0, 3).map((j, idx) => ({
        num: `0${idx + 1}`,
        title: j.title,
        date: j.date,
        tag: j.category,
      }))
    : [
        { num: '01', title: 'The Aesthetics of Digital Decay',   date: 'Oct 24, 2024', tag: 'Design' },
        { num: '02', title: 'Why We Play: Mechanics vs. Narrative', date: 'Oct 18, 2024', tag: 'Games' },
        { num: '03', title: 'Curating the Personal Archive',     date: 'Oct 12, 2024', tag: 'Journal' },
      ]

  return (
    <main className="page-main">
      {/* ── Hero Section (Full width background) ─────────────────── */}
      <section className="hero-section-full" style={{
        backgroundImage: `linear-gradient(to bottom, rgba(20, 19, 19, 0.2), var(--background)), url('/hero-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        paddingTop: '80px',
        position: 'relative'
      }}>
        <div className="container">
          <div className="hero" style={{ paddingTop: '60px', paddingBottom: '100px', minHeight: 'auto' }}>
            <div className="hero-content">
              <span className="hero-archive-label">{settings.heroLabel}</span>
              <h1>{settings.heroTitle}</h1>
              <p className="hero-desc">{settings.heroSubtitle}</p>
            </div>
            <div className="hero-glow" />
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Currently Watching ────────────────────────────── */}
        <section>
          <div className="section-header">
            <h2>{settings.watchingTitle}</h2>
            <Link to="/film" className="section-link">View Index →</Link>
          </div>
          <div className="bento-grid">
            <div className="bento-main">
              {featuredFilm ? (
                <article className="bento-feature">
                  <div className="bento-feature-img" style={{ backgroundImage: `url('${featuredFilm.img}')` }} />
                  <div className="bento-feature-overlay">
                    <span className="bento-category">{featuredFilm.category}</span>
                    <h3 className="bento-feature-title">{featuredFilm.title}</h3>
                    <p className="bento-feature-desc">Released in {featuredFilm.year}</p>
                  </div>
                </article>
              ) : (
                <article className="bento-feature">
                  <div className="bento-feature-img" style={{ backgroundImage: `url('${FILM_IMG}')` }} />
                  <div className="bento-feature-overlay">
                    <span className="bento-category">Film</span>
                    <h3 className="bento-feature-title">The Architecture of Silence</h3>
                    <p className="bento-feature-desc">Exploring the use of negative space in contemporary sci-fi cinema and its psychological impact on the viewer.</p>
                  </div>
                </article>
              )}
            </div>
            <div className="bento-sidebar">
              {displaySideFilms.map((f) => (
                <article key={f.num} className="bento-card">
                  <div>
                    <span className="bento-card-num">{f.num}</span>
                    <h4 className="bento-card-title">{f.title}</h4>
                    <p className="bento-card-desc">{f.desc}</p>
                  </div>
                  {f.rating > 0 && <div style={{ marginTop: '16px' }}><StarRating rating={f.rating} /></div>}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── In the Library ────────────────────────────────── */}
        <section>
          <div className="section-header">
            <h2>{settings.libraryTitle}</h2>
            <Link to="/books" className="section-link">View Index →</Link>
          </div>
          {displayBook ? (
            <div className="library-grid">
              <div className="library-text">
                <div className="library-quote">
                  <p>"A book must be the axe for the frozen sea within us."</p>
                </div>
                <h3 className="library-book-title">{displayBook.title}</h3>
                <p className="library-book-desc">{displayBook.desc}</p>
                <ul className="library-meta">
                  <li className="library-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    {displayBook.isCurrent ? 'Currently Reading' : displayBook.category}
                  </li>
                  {displayBook.pages && (
                    <li className="library-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      {displayBook.pages.toLowerCase().includes('page') ? displayBook.pages : `${displayBook.pages} pages`}
                    </li>
                  )}
                </ul>
              </div>
              <div className="library-image">
                <div className="library-image-container">
                  <div className="library-image-bg" style={{ backgroundImage: `url('${displayBook.img}')` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="library-grid">
              <div className="library-text">
                <div className="library-quote">
                  <p>"A book must be the axe for the frozen sea within us."</p>
                </div>
                <h3 className="library-book-title">The Design of Everyday Things</h3>
                <p className="library-book-desc">Revisiting Don Norman's classic text. It remains remarkably prescient in an era of increasingly complex digital interfaces.</p>
                <ul className="library-meta">
                  <li className="library-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    Currently Reading
                  </li>
                  <li className="library-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    Page 142 / 368
                  </li>
                </ul>
              </div>
              <div className="library-image">
                <div className="library-image-container">
                  <div className="library-image-bg" style={{ backgroundImage: `url('${BOOK_IMG}')` }} />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Recent Thoughts ───────────────────────────────── */}
        <section>
          <div className="section-header">
            <h2>{settings.thoughtsTitle}</h2>
            <Link to="/journal" className="section-link">View Journal →</Link>
          </div>
          <div className="thoughts-list">
            {displayThoughts.map((t) => (
              <Link to="/journal" key={t.num} className="thought-item">
                <div className="thought-inner">
                  <div className="thought-left">
                    <span className="thought-num">{t.num}</span>
                    <h3 className="thought-title">{t.title}</h3>
                  </div>
                  <div className="thought-meta">
                    <span>{t.date}</span>
                    <span className="thought-divider" />
                    <span>{t.tag}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
