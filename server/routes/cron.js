import express from 'express'
import { runScheduledSync } from '../services/cronService.js'

const router = express.Router()

// GET /api/cron/sync or POST /api/cron/sync
router.all('/sync', async (req, res) => {
  // Optional security check for Vercel / external cron callers
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization
    const querySecret = req.query.secret
    const token = authHeader ? authHeader.replace('Bearer ', '') : querySecret

    if (token !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized: Invalid CRON_SECRET token' })
    }
  }

  try {
    const result = await runScheduledSync()
    res.json({
      timestamp: new Date().toISOString(),
      ...result
    })
  } catch (err) {
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString()
    })
  }
})

export default router
