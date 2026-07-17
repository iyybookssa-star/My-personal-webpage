import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './db.js'
import settingsRouter from './routes/settings.js'
import authRouter from './routes/auth.js'
import subscribersRouter from './routes/subscribers.js'
import filmsRouter from './routes/films.js'
import gamesRouter from './routes/games.js'
import booksRouter from './routes/books.js'
import journalsRouter from './routes/journals.js'
import Admin from './models/Admin.js'
import Film from './models/Film.js'
import Game from './models/Game.js'
import Book from './models/Book.js'
import Journal from './models/Journal.js'
import Settings from './models/Settings.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/settings',    settingsRouter)
app.use('/api/auth',        authRouter)
app.use('/api/subscribers', subscribersRouter)
app.use('/api/films',       filmsRouter)
app.use('/api/games',       gamesRouter)
app.use('/api/books',       booksRouter)
app.use('/api/journals',    journalsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Default Seeding Data
const initialFilms = [
  { title: 'Blade Runner 2049', year: '2017', category: 'Recently Watched', img: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80', order: 0 },
  { title: 'The Curator', year: '2024', category: 'Favorites', img: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80', order: 1 },
  { title: 'Annihilation', year: '2018', category: 'Favorites', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', order: 2 },
  { title: 'Arrival', year: '2016', category: 'Watchlist', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80', order: 3 },
  { title: 'Ghost in the Shell', year: '1995', category: 'Recently Watched', img: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80', order: 4 },
  { title: 'Stalker', year: '1979', category: 'Favorites', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', order: 5 },
  { title: 'Memoria', year: '2021', category: 'Recently Watched', img: 'https://images.unsplash.com/photo-1474314881477-04c4aac40a0e?w=400&q=80', order: 6 },
  { title: 'Solaris', year: '1972', category: 'Watchlist', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80', order: 7 },
  { title: 'The Mirror', year: '1975', category: 'Watchlist', img: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=80', order: 8 },
  { title: 'Mulholland Drive', year: '2001', category: 'Favorites', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', order: 9 }
]

const initialGames = [
  { title: 'Control', year: '2019', studio: 'Remedy Entertainment', rating: 5, category: 'Recently Played', desc: 'A masterclass in brutalist architecture and new weird fiction. The oldest house remains one of the most compelling digital spaces ever constructed.', img: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=600&q=80', order: 0 },
  { title: 'Shadow of the Colossus', year: '2005', studio: 'Team Ico', rating: 5, category: 'Favorites', desc: 'Minimalist storytelling achieved through immense scale and deliberate emptiness. A tragic exploration of isolation and sacrifice.', img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&q=80', order: 1 },
  { title: 'Disco Elysium', year: '2019', studio: 'ZA/UM', rating: 5, category: 'Favorites', desc: 'An unprecedented achievement in interactive writing. It forces the player to inhabit the mind of a fractured protagonist within a decaying world.', img: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=600&q=80', order: 2 },
  { title: 'Echo', year: '2017', studio: 'Ultra Ultra', rating: 4.5, category: 'Backlog', desc: 'A chilling exploration of artificial intelligence and repetition. The palace architecture is as punishing as the enemies that learn from you.', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', order: 3 }
]

const initialBooks = [
  { title: 'The Digital Age of Artifacts', category: 'Philosophy & Tech', desc: 'An exploration into how we assign value to digital ephemera in a world increasingly moving away from physical media ownership. A foundational text for the modern archivist.', pages: '412', year: '2023', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80', isCurrent: true, order: 0 },
  { title: 'Simulated Realities', category: 'Essays', desc: 'A collection of essays dissecting the sociological impact of persistent virtual worlds.', pages: '280', year: '2021', img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=700&q=80', isCurrent: false, order: 1 },
  { title: 'The Glass Hotel', category: 'Fiction', desc: "Mandel's intricate narrative on wealth, illusion, and consequence.", pages: '320', year: '2020', img: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=700&q=80', isCurrent: false, order: 2 }
]

const initialJournals = [
  { title: 'The Architecture of Silence: Finding Focus in a Noisy Era', category: 'Philosophy', date: 'October 24, 2024', desc: 'In an age defined by constant connectivity, true luxury is found in the deliberate construction of quiet spaces. We examine how digital minimalism isn\'t just about deleting apps, but rebuilding our relationship with boredom.', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=80', isFeatured: true, order: 0 },
  { title: 'Synthesizing the Analog Web', category: 'Tech', date: 'Oct 18', desc: 'Exploring tools and protocols that bring the tactile satisfaction of physical media back to our daily browsing habits.', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80', isFeatured: false, order: 1 },
  { title: 'Rituals over Routines', category: 'Daily Life', date: 'Oct 12', desc: 'A routine is a series of actions performed for efficiency. A ritual is a series of actions performed for meaning. How I\'ve restructured my mornings.', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80', isFeatured: false, order: 2 },
  { title: 'On Marginalia', category: 'Books', date: 'Sep 28', desc: 'The lost art of writing in books, and why the pristine condition of a volume is a sign of a neglected mind.', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&q=80', isFeatured: false, order: 3 },
  { title: 'The Weight of Memory', category: 'Philosophy', date: 'Sep 15', desc: 'How physical artifacts anchor our fleeting digital memories in reality.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', isFeatured: false, order: 4 }
]

// Start
connectDB().then(async () => {
  try {
    // Seed initial admin password if none exists
    const existing = await Admin.findOne({ username: 'admin' })
    if (!existing) {
      const initialPassword = process.env.ADMIN_PASSWORD || '2240002989'
      await Admin.setPassword(initialPassword)
      console.log('🔑  Admin password seeded from .env (ADMIN_PASSWORD)')
    }
    // Update or create main settings document to use "Ibrahim’s Digest"
    await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { siteTitle: 'Ibrahim’s Digest' } },
      { upsert: true, new: true }
    )
    // Seed default collections if empty (only if never seeded before)
    const currentSettings = await Settings.findOne({ key: 'main' })
    const hasSeeded = currentSettings ? currentSettings.hasSeeded : false

    if (!hasSeeded) {
      if ((await Film.countDocuments()) === 0) {
        await Film.create(initialFilms)
        console.log('🎬  Seeded initial films')
      }
      if ((await Game.countDocuments()) === 0) {
        await Game.create(initialGames)
        console.log('🎮  Seeded initial games')
      }
      if ((await Book.countDocuments()) === 0) {
        await Book.create(initialBooks)
        console.log('📚  Seeded initial books')
      }
      if ((await Journal.countDocuments()) === 0) {
        await Journal.create(initialJournals)
        console.log('📝  Seeded initial journal entries')
      }

      await Settings.findOneAndUpdate(
        { key: 'main' },
        { $set: { hasSeeded: true } },
        { upsert: true }
      )
    }
  } catch (seedErr) {
    console.error('Error seeding data:', seedErr.message)
  }

  // Only start listening if we are running locally (not on Vercel)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀  API server → http://localhost:${PORT}`)
    })
  }
})

export default app

