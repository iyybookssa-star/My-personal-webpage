import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import SubscribeModal from './SubscribeModal'

const links = [
  { to: '/', label: 'Home' },
  { to: '/film', label: 'Film' },
  { to: '/games', label: 'Games' },
  { to: '/books', label: 'Books' },
  { to: '/journal', label: 'Journal' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { settings, visits, subscriberCount } = useAdmin()

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-logo">{settings.siteTitle}</NavLink>

          <nav className={`navbar-nav${open ? ' open' : ''}`}>
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar-stats">
            <span className="stat-visits">{visits} visits</span>
            <span className="stat-divider">·</span>
            <span className="stat-subs">{subscriberCount} followers</span>
          </div>

          <button className="navbar-subscribe" onClick={() => setModalOpen(true)}>
            Subscribe
          </button>

          <button
            className="navbar-mobile-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <SubscribeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
