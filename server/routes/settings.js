import express from 'express'
import Settings from '../models/Settings.js'

const router = express.Router()

// GET /api/settings — return current settings (or defaults if none saved yet)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'main' })
    if (!settings) {
      settings = await Settings.create({ key: 'main' })
    }
    res.json(settings)
  } catch (err) {
    console.error('GET /api/settings error:', err)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// POST /api/settings/increment-visits — increment visits counter
router.post('/increment-visits', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $inc: { visits: 1 } },
      { new: true, upsert: true }
    )
    res.json({ visits: settings.visits })
  } catch (err) {
    console.error('Failed to increment visits:', err)
    res.status(500).json({ error: 'Failed to increment visits' })
  }
})

// PUT /api/settings — update settings
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    )
    res.json(settings)
  } catch (err) {
    console.error('PUT /api/settings error:', err)
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

// DELETE /api/settings — reset to defaults
router.delete('/', async (req, res) => {
  try {
    const oldSettings = await Settings.findOne({ key: 'main' })
    const wasSeeded = oldSettings ? oldSettings.hasSeeded : false

    await Settings.deleteOne({ key: 'main' })
    const settings = await Settings.create({ key: 'main', hasSeeded: wasSeeded })
    res.json(settings)
  } catch (err) {
    console.error('DELETE /api/settings error:', err)
    res.status(500).json({ error: 'Failed to reset settings' })
  }
})

export default router
