import express from 'express'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'curator_dev_secret'

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const valid = await Admin.verifyPassword(password)
    if (!valid) return res.status(401).json({ error: 'Incorrect password' })

    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/change-password  (requires valid token)
router.post('/change-password', async (req, res) => {
  try {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' })

    jwt.verify(auth.slice(7), JWT_SECRET)

    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    await Admin.setPassword(newPassword)
    res.json({ message: 'Password updated successfully' })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router
