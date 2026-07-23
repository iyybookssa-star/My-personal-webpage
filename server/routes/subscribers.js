import express from 'express'
import Subscriber from '../models/Subscriber.js'
import { notifyAllSubscribers } from '../services/emailService.js'

const router = express.Router()

// POST /api/subscribers — add new subscriber
router.post('/', async (req, res) => {
  try {
    const { email, name } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const existing = await Subscriber.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ error: 'This email is already subscribed' })
    }

    const subscriber = await Subscriber.create({ email, name })
    console.log(`📧  New subscriber: ${subscriber.email}`)
    res.status(201).json({ message: 'Subscribed successfully!', subscriber })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'This email is already subscribed' })
    }
    console.error('Subscribe error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/subscribers/notify — broadcast email to active subscribers
router.post('/notify', async (req, res) => {
  try {
    const { subject, title, excerpt, link } = req.body
    if (!title || !excerpt) {
      return res.status(400).json({ error: 'Title and excerpt/message are required' })
    }

    const result = await notifyAllSubscribers({ subject, title, excerpt, link })
    res.json({ success: true, ...result })
  } catch (err) {
    console.error('Notify subscribers error:', err)
    res.status(500).json({ error: err.message || 'Failed to send notifications' })
  }
})

// GET /api/subscribers/count — total count (public)
router.get('/count', async (req, res) => {
  try {
    const count = await Subscriber.countDocuments({ active: true })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/subscribers — full list
router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber
      .find({ active: true })
      .sort({ createdAt: -1 })
      .select('email name createdAt')
    res.json({ count: subscribers.length, subscribers })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/subscribers/:id — unsubscribe
router.delete('/:id', async (req, res) => {
  try {
    await Subscriber.findByIdAndUpdate(req.params.id, { active: false })
    res.json({ message: 'Unsubscribed' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
