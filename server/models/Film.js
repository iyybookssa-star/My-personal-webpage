import mongoose from 'mongoose'

const filmSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    year: { type: String, required: true },
    category: { type: mongoose.Schema.Types.Mixed, required: true },
    img: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Film', filmSchema)
