import { useState } from 'react'
import { useAdmin } from '../../context/AdminContext'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, login } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const ok = await login(password)
    setLoading(false)
    if (!ok) {
      setError(true)
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
  }

  if (isAuthenticated) return <>{children}</>

  return (
    <div className="admin-gate">
      <div className={`admin-gate-card${shake ? ' shake' : ''}`}>
        <div className="admin-gate-icon">🔒</div>
        <h1 className="admin-gate-title">Admin Access</h1>
        <p className="admin-gate-subtitle">Enter your password to continue</p>
        <form onSubmit={handleSubmit} className="admin-gate-form">
          <input
            type="password"
            className={`admin-gate-input${error ? ' error' : ''}`}
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            autoFocus
          />
          {error && <span className="admin-gate-error">Incorrect password</span>}
          <button type="submit" className="admin-gate-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Enter Dashboard'}
          </button>
        </form>
      
      </div>
    </div>
  )
}
