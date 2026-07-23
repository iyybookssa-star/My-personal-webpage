import express from 'express'
import Journal from '../models/Journal.js'
import { notifyAllSubscribers } from '../services/emailService.js'

const router = express.Router()

// GET /api/journals
router.get('/', async (req, res) => {
  try {
    const journals = await Journal.find().sort({ order: 1 })
    res.json(journals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/journals
router.post('/', async (req, res) => {
  try {
    const { notifySubscribers, ...journalData } = req.body
    const lastItem = await Journal.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 0
    const journal = await Journal.create({ ...journalData, order: nextOrder })

    if (notifySubscribers) {
      notifyAllSubscribers({
        subject: `New Journal Post: ${journal.title}`,
        title: journal.title,
        excerpt: journal.excerpt || journal.body?.slice(0, 150) + '...',
        link: `${req.protocol}://${req.get('host')}/journal/${journal.slug || journal._id}`
      }).catch(e => console.error('Error broadcasting journal notification:', e))
    }

    res.status(201).json(journal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/journals/:id
router.put('/:id', async (req, res) => {
  try {
    const { notifySubscribers, ...journalData } = req.body
    const journal = await Journal.findByIdAndUpdate(req.params.id, journalData, { new: true })

    if (notifySubscribers && journal) {
      notifyAllSubscribers({
        subject: `Journal Updated: ${journal.title}`,
        title: journal.title,
        excerpt: journal.excerpt || journal.body?.slice(0, 150) + '...',
        link: `${req.protocol}://${req.get('host')}/journal/${journal.slug || journal._id}`
      }).catch(e => console.error('Error broadcasting journal notification:', e))
    }

    res.json(journal)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/journals/reorder
router.put('/reorder/list', async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
  try {
    const promises = orderedIds.map((id, index) =>
      Journal.findByIdAndUpdate(id, { order: index })
    )
    await Promise.all(promises)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/journals/:id
router.delete('/:id', async (req, res) => {
  try {
    const ids = req.params.id.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 1) {
      await Journal.deleteMany({ _id: { $in: ids } })
    } else if (ids.length === 1) {
      await Journal.findByIdAndDelete(ids[0])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
