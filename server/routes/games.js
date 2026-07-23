import express from 'express'
import Game from '../models/Game.js'

const router = express.Router()

// GET /api/games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ order: 1 })
    res.json(games)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/games
router.post('/', async (req, res) => {
  try {
    const lastItem = await Game.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 0
    const gameData = {
      title: req.body.title,
      category: req.body.category,
      img: req.body.img,
      year: req.body.year,
      studio: req.body.studio || '',
      rating: req.body.rating ? Number(req.body.rating) : 5,
      desc: req.body.desc || '',
      order: nextOrder
    }
    const game = await Game.create(gameData)
    res.status(201).json(game)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/games/:id
router.put('/:id', async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      category: req.body.category,
      img: req.body.img,
      year: req.body.year,
      studio: req.body.studio || '',
      rating: req.body.rating ? Number(req.body.rating) : 5,
      desc: req.body.desc || ''
    }
    const game = await Game.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(game)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/games/reorder
router.put('/reorder/list', async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
  try {
    const promises = orderedIds.map((id, index) =>
      Game.findByIdAndUpdate(id, { order: index })
    )
    await Promise.all(promises)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/games/:id
router.delete('/:id', async (req, res) => {
  try {
    const ids = req.params.id.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 1) {
      await Game.deleteMany({ _id: { $in: ids } })
    } else if (ids.length === 1) {
      await Game.findByIdAndDelete(ids[0])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
