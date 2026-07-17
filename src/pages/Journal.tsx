import { useState, useEffect } from 'react'
import { useAdmin } from '../context/AdminContext'

interface JournalItem {
  _id: string
  title: string
  category: string
  date: string
  desc: string
  img: string
  isFeatured: boolean
}

const TABS = ['All Entries', 'Tech', 'Daily Life', 'Reviews']

export default function Journal() {
  const { settings } = useAdmin()
  const [journals, setJournals] = useState<JournalItem[]>([])
  const [activeTab, setActiveTab] = useState('All Entries')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/journals')
      .then((r) => r.json())
      .then((data) => {
        setJournals(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const featured = journals.find((j) => j.isFeatured)
  const listItems = journals.filter((j) => !j.isFeatured)

  const filtered =
    activeTab === 'All Entries'
      ? listItems
      : listItems.filter((a) => a.category === activeTab)

  return (
    <main className="page-main">
      <header className="page-header-full">
        <div className="container">
          {/* Hero */}
          <section className="page-hero">
            <h1>{settings.journalPageTitle}</h1>
            <p className="page-hero-desc">{settings.journalPageDesc}</p>
          </section>
        </div>
      </header>

      <div className="container">

        {loading ? (
          <p className="admin-loading" style={{ textAlign: 'center' }}>Loading notes...</p>
        ) : (
          <>
            {/* Featured post */}
            {featured ? (
              <section className="journal-featured">
                <div className="journal-featured-text">
                  <div className="journal-featured-meta">
                    <span className="journal-category-tag">{featured.category}</span>
                    <span className="journal-featured-date">{featured.date}</span>
                  </div>
                  <h2 className="journal-featured-title">{featured.title}</h2>
                  <p className="journal-featured-desc">{featured.desc}</p>
                  <button className="read-essay-btn">Read Essay</button>
                </div>
                <div
                  className="journal-featured-img"
                  style={{ backgroundImage: `url('${featured.img}')` }}
                />
              </section>
            ) : (
              <div className="journal-featured" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                <p className="admin-empty">No featured notes.</p>
              </div>
            )}

            {/* Filters */}
            <div className="journal-filters">
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

            {/* Articles grid */}
            <div className="journal-articles-grid">
              {filtered.map((article) => (
                <article key={article._id} className="journal-article-card">
                  <div
                    className="journal-article-img"
                    style={{ backgroundImage: `url('${article.img}')`, height: '200px', backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                  <div className="journal-article-body">
                    <div className="journal-article-meta">
                      <span className="journal-article-cat">{article.category}</span>
                      <span>/</span>
                      <span>{article.date}</span>
                    </div>
                    <h3 className="journal-article-title">{article.title}</h3>
                    <p className="journal-article-desc">{article.desc}</p>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && (
                <p className="admin-empty" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No entries found.</p>
              )}
            </div>

            {/* Quote */}
            <blockquote className="journal-quote-block">
              <p className="journal-quote-text">
                "We curate our environments, digital and physical, not merely to organize
                information, but to construct a mirror reflecting the mind we wish to inhabit."
              </p>
              <cite className="journal-quote-attr">— Archival Note #042</cite>
            </blockquote>

            {/* Load more */}
            <button className="load-more-btn">Load Archive Index</button>
          </>
        )}

      </div>
    </main>
  )
}
