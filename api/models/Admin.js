import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, default: 'admin', unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

// Hash plain password and store
adminSchema.statics.setPassword = async function (plain) {
  const hash = await bcrypt.hash(plain, 12)
  return this.findOneAndUpdate(
    { username: 'admin' },
    { passwordHash: hash },
    { upsert: true, new: true }
  )
}

// Verify a plain password against stored hash
adminSchema.statics.verifyPassword = async function (plain) {
  const admin = await this.findOne({ username: 'admin' })
  if (!admin) return false
  return bcrypt.compare(plain, admin.passwordHash)
}

export default mongoose.model('Admin', adminSchema)
