import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    desc: { type: String, default: '' },
    pages: { type: String, default: '' },
    year: { type: String, default: '' },
    img: { type: String, required: true },
    isCurrent: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Book', bookSchema)
