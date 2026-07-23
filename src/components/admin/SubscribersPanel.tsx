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

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastExcerpt, setBroadcastExcerpt] = useState('')
  const [broadcastLink, setBroadcastLink] = useState('')
  const [broadcastStatus, setBroadcastStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [broadcasting, setBroadcasting] = useState(false)

  useEffect(() => {
    fetch('/api/subscribers')
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
    await fetch(`/api/subscribers/${id}`, { method: 'DELETE' })
    setSubscribers(prev => prev.filter(s => s._id !== id))
    setCount(c => c - 1)
  }

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastTitle.trim() || !broadcastExcerpt.trim()) {
      setBroadcastStatus({ type: 'error', message: 'Title and message/excerpt are required.' })
      return
    }

    setBroadcasting(true)
    setBroadcastStatus({ type: 'info', message: 'Sending email broadcast to subscribers...' })

    try {
      const res = await fetch('/api/subscribers/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject.trim() || broadcastTitle.trim(),
          title: broadcastTitle.trim(),
          excerpt: broadcastExcerpt.trim(),
          link: broadcastLink.trim() || window.location.origin
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast')

      const modeInfo = data.simulated ? ' (Simulation Mode — logged to server console)' : ''
      if (data.sent === 0 && data.errorDetails) {
        setBroadcastStatus({
          type: 'error',
          message: `Could not send emails. Resend API returned: ${data.errorDetails}`
        })
      } else {
        setBroadcastStatus({
          type: data.failed > 0 ? 'info' : 'success',
          message: `Notified ${data.sent} of ${data.total} subscriber(s).${data.errorDetails ? ` (Details: ${data.errorDetails})` : ''}${modeInfo}`
        })
        setBroadcastSubject('')
        setBroadcastTitle('')
        setBroadcastExcerpt('')
        setBroadcastLink('')
      }
    } catch (err: any) {
      setBroadcastStatus({ type: 'error', message: err.message || 'Error broadcasting email.' })
    } finally {
      setBroadcasting(false)
    }
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

      {/* Broadcast Email Card */}
      <div className="admin-section">
        <h3 className="admin-section-title">📧 Broadcast Email Update</h3>
        <p style={{ color: '#a9a9b3', fontSize: '14px', marginBottom: '16px' }}>
          Send an update email to all active subscribers when new content is added or updated.
        </p>

        {broadcastStatus && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px',
              backgroundColor:
                broadcastStatus.type === 'success' ? 'rgba(74, 222, 128, 0.15)' :
                broadcastStatus.type === 'error' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(96, 165, 250, 0.15)',
              color:
                broadcastStatus.type === 'success' ? '#4ade80' :
                broadcastStatus.type === 'error' ? '#f87171' : '#60a5fa',
              border: `1px solid ${
                broadcastStatus.type === 'success' ? 'rgba(74, 222, 128, 0.3)' :
                broadcastStatus.type === 'error' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(96, 165, 250, 0.3)'
              }`
            }}
          >
            {broadcastStatus.message}
          </div>
        )}

        <form onSubmit={handleBroadcast} style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a9a9b3', marginBottom: '4px' }}>
              Email Subject Line
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. New Journal Entry: Reflections on Design"
              value={broadcastSubject}
              onChange={e => setBroadcastSubject(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a9a9b3', marginBottom: '4px' }}>
              Headline / Title *
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. Fresh Updates Posted"
              value={broadcastTitle}
              onChange={e => setBroadcastTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a9a9b3', marginBottom: '4px' }}>
              Message Summary / Excerpt *
            </label>
            <textarea
              className="admin-input"
              rows={4}
              placeholder="Write a brief description of the new content or updates..."
              value={broadcastExcerpt}
              onChange={e => setBroadcastExcerpt(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#a9a9b3', marginBottom: '4px' }}>
              Button Link URL (Optional)
            </label>
            <input
              type="text"
              className="admin-input"
              placeholder="e.g. https://yourdomain.com/journal"
              value={broadcastLink}
              onChange={e => setBroadcastLink(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={broadcasting || count === 0}
            style={{ justifySelf: 'start', marginTop: '4px' }}
          >
            {broadcasting ? 'Sending Broadcast...' : '🚀 Send Email to All Subscribers'}
          </button>
        </form>
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
