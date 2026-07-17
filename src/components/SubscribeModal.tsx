import { useState } from 'react'

interface SubscribeModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setStatus(null)

    try {
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()
      if (response.ok) {
        setStatus({ type: 'success', message: data.message || 'Subscribed successfully!' })
        setEmail('')
        setName('')
        setTimeout(() => {
          onClose()
          setStatus(null)
        }, 2000)
      } else {
        setStatus({ type: 'error', message: data.error || 'Subscription failed.' })
      }
    } catch {
      setStatus({ type: 'error', message: 'Could not connect to server. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>
        <h2 className="modal-title">Subscribe to the Archive</h2>
        <p className="modal-subtitle">Get updates on new essays, cinema reviews, and curation logs.</p>

        {status && (
          <div className={`modal-status ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-input-group">
            <label className="modal-label">Your Name</label>
            <input
              type="text"
              className="modal-input"
              placeholder="E.g. Ibrahim"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="modal-input-group">
            <label className="modal-label">Email Address *</label>
            <input
              type="email"
              className="modal-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="modal-submit-btn" disabled={loading}>
            {loading ? 'Subscribing...' : 'Confirm Subscription'}
          </button>
        </form>
      </div>
    </div>
  )
}
