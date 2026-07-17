import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Film from './pages/Film'
import Games from './pages/Games'
import Books from './pages/Books'
import Journal from './pages/Journal'
import Admin from './pages/Admin'

function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/admin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdmin && <Navbar />}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/film"    element={<Film />} />
          <Route path="/games"   element={<Games />} />
          <Route path="/books"   element={<Books />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/admin"   element={<Admin />} />
        </Routes>
      </div>
      {!isAdmin && <Footer />}
    </div>
  )
}

export default App
