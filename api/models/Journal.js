import mongoose from 'mongoose'

const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    desc: { type: String, default: '' },
    img: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Journal', journalSchema)
