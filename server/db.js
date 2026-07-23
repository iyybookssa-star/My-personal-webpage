import mongoose from 'mongoose'
import dotenv from 'dotenv'
import dns from 'dns'

// Force Node to use Cloudflare public DNS for resolving Atlas SRV records
dns.setServers(['1.1.1.1', '8.8.8.8'])

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is missing from .env')
  process.exit(1)
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅  MongoDB connected:', mongoose.connection.host)
  } catch (err) {
    console.error('❌  MongoDB connection failed:', err.message)
    process.exit(1)
  }
}
