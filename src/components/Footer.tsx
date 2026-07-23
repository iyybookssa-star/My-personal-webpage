import { useAdmin } from '../context/AdminContext'

export default function Footer() {
  const { settings } = useAdmin()

  const letterboxdUser = settings.letterboxdUsername || 'engelibrahimo'
  const letterboxdHref = `https://letterboxd.com/${letterboxdUser}/`

  const socials = [
    { label: 'Instagram', href: 'https://www.instagram.com/ibrahim_y_alyahya' },
    { label: 'Letterboxd', href: letterboxdHref },
    { label: 'GitHub', href: 'https://github.com/iyybookssa-star' },
  ]

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <span className="footer-logo">{settings.siteTitle}</span>
          <ul className="footer-links">
            {socials.map(({ label, href }) => (
              <li key={label}>
                <a 
                  href={href} 
                  className="footer-link"
                  {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <span className="footer-copy">{settings.footerCopy}</span>
        </div>
      </div>
    </footer>
  )
}
