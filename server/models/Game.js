import mongoose from 'mongoose'

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    year: { type: String, required: true },
    studio: { type: String, default: '' },
    rating: { type: Number, default: 5 },
    category: { type: String, required: true },
    desc: { type: String, default: '' },
    img: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Game', gameSchema)
