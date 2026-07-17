import { useAdmin } from '../context/AdminContext'

const socials = [
  { label: 'Twitter', href: '#' },
  { label: 'Letterboxd', href: '#' },
  { label: 'Steam', href: '#' },
  { label: 'RSS', href: '#' },
]

export default function Footer() {
  const { settings } = useAdmin()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <span className="footer-logo">{settings.siteTitle}</span>
          <ul className="footer-links">
            {socials.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className="footer-link">{label}</a>
              </li>
            ))}
          </ul>
          <span className="footer-copy">{settings.footerCopy}</span>
        </div>
      </div>
    </footer>
  )
}
