import express from 'express'
import { execSync } from 'child_process'
import Film from '../models/Film.js'
import { syncLetterboxdData } from '../services/letterboxdService.js'

const router = express.Router()

// GET /api/films
router.get('/', async (req, res) => {
  try {
    const films = await Film.find().sort({ order: 1 })
    res.json(films)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/films
router.post('/', async (req, res) => {
  try {
    const lastItem = await Film.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 0
    const film = await Film.create({ ...req.body, order: nextOrder })
    res.status(201).json(film)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/films/:id
router.put('/:id', async (req, res) => {
  try {
    const film = await Film.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(film)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/films/reorder
router.put('/reorder/list', async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
  try {
    const promises = orderedIds.map((id, index) =>
      Film.findByIdAndUpdate(id, { order: index })
    )
    await Promise.all(promises)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET or POST /api/films/sync-letterboxd
router.all('/sync-letterboxd', async (req, res) => {
  const username = req.method === 'POST' ? req.body.username : req.query.username
  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  const isStreaming = req.headers.accept === 'text/event-stream' || req.method === 'GET'

  if (isStreaming) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    res.write('\n') // Keep connection alive
  }

  const sendUpdate = (data) => {
    if (isStreaming) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }

  try {
    const result = await syncLetterboxdData({ username, sendUpdate })
    if (isStreaming) {
      res.end()
    } else {
      res.json(result)
    }
  } catch (err) {
    if (isStreaming) {
      sendUpdate({ type: 'error', error: err.message })
      res.end()
    } else {
      res.status(500).json({ error: err.message })
    }
  }
})

// DELETE /api/films/:id
router.delete('/:id', async (req, res) => {
  try {
    const ids = req.params.id.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 1) {
      await Film.deleteMany({ _id: { $in: ids } })
    } else if (ids.length === 1) {
      await Film.findByIdAndDelete(ids[0])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
