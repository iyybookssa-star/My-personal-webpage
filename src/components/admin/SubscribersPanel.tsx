import { useState, useEffect } from 'react'

interface Subscriber {
  _id: string
  email: string
  name: string
  createdAt: string
}

export default function SubscribersPanel() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:3001/api/subscribers')
      .then(r => r.json())
      .then(data => {
        setSubscribers(data.subscribers || [])
        setCount(data.count || 0)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load subscribers — is the server running?')
        setLoading(false)
      })
  }, [])

  const handleUnsubscribe = async (id: string) => {
    if (!window.confirm('Remove this subscriber?')) return
    await fetch(`http://localhost:3001/api/subscribers/${id}`, { method: 'DELETE' })
    setSubscribers(prev => prev.filter(s => s._id !== id))
    setCount(c => c - 1)
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h2>Subscribers</h2>
        <p>Everyone who signed up via the Subscribe button</p>
      </div>

      {/* Stats */}
      <div className="admin-section">
        <h3 className="admin-section-title">Overview</h3>
        <div className="subscriber-stats">
          <div className="subscriber-stat-card">
            <span className="subscriber-stat-num">{loading ? '…' : count}</span>
            <span className="subscriber-stat-label">Total Subscribers</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="admin-section">
        <h3 className="admin-section-title">Subscriber List</h3>
        {loading && <p className="admin-loading">Loading…</p>}
        {error && <p className="admin-error">{error}</p>}
        {!loading && !error && subscribers.length === 0 && (
          <p className="admin-empty">No subscribers yet. Share your site!</p>
        )}
        {!loading && subscribers.length > 0 && (
          <div className="subscriber-list">
            {subscribers.map(s => (
              <div key={s._id} className="subscriber-row">
                <div className="subscriber-info">
                  <span className="subscriber-email">{s.email}</span>
                  {s.name && <span className="subscriber-name">{s.name}</span>}
                  <span className="subscriber-date">
                    {new Date(s.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <button
                  className="subscriber-remove-btn"
                  onClick={() => handleUnsubscribe(s._id)}
                  title="Remove subscriber"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
