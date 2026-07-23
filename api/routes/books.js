import express from 'express'
import Book from '../models/Book.js'

const router = express.Router()

// GET /api/books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ order: 1 })
    res.json(books)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/books
router.post('/', async (req, res) => {
  try {
    const lastItem = await Book.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 0
    const book = await Book.create({ ...req.body, order: nextOrder })
    res.status(201).json(book)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/books/:id
router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(book)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/books/reorder
router.put('/reorder/list', async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
  try {
    const promises = orderedIds.map((id, index) =>
      Book.findByIdAndUpdate(id, { order: index })
    )
    await Promise.all(promises)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/books/:id
router.delete('/:id', async (req, res) => {
  try {
    const ids = req.params.id.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 1) {
      await Book.deleteMany({ _id: { $in: ids } })
    } else if (ids.length === 1) {
      await Book.findByIdAndDelete(ids[0])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
