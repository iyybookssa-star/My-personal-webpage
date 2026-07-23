import cron from 'node-cron'
import Settings from '../models/Settings.js'
import { syncLetterboxdData } from './letterboxdService.js'

let cronTask = null

/**
 * Executes the scheduled API data sync.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function runScheduledSync() {
  console.log('⏰ [12:00 AM Cron] Starting daily API data sync...')

  try {
    const settings = await Settings.findOne({ key: 'main' })
    if (!settings) {
      console.log('⏰ [12:00 AM Cron] No settings found. Skipping sync.')
      return { success: false, message: 'Settings document not found' }
    }

    if (settings.autoSyncEnabled === false) {
      console.log('⏰ [12:00 AM Cron] Auto-sync is currently disabled in Settings. Skipping.')
      return { success: false, message: 'Auto-sync is disabled' }
    }

    const username = settings.letterboxdUsername || 'engelibrahimo'
    console.log(`⏰ [12:00 AM Cron] Syncing data for Letterboxd user: ${username}`)

    const result = await syncLetterboxdData({ username })
    console.log(`⏰ [12:00 AM Cron] Finished successfully. Added ${result.addedCount} items.`)
    return {
      success: true,
      message: `Sync completed. Added ${result.addedCount} items.`,
      addedCount: result.addedCount
    }
  } catch (err) {
    console.error('⏰ [12:00 AM Cron] Sync failed:', err.message)
    return { success: false, message: err.message }
  }
}

/**
 * Initializes the node-cron task running at 12:00 AM daily (0 0 * * *).
 */
export function initCronJobs() {
  const timezone = process.env.CRON_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh'
  console.log(`📅  Initializing Daily API Sync scheduler (12:00 AM midnight, Timezone: ${timezone})`)

  // Pattern: 0 0 * * * => Minute 0, Hour 0 (12 AM midnight), every day
  cronTask = cron.schedule(
    '0 0 * * *',
    async () => {
      await runScheduledSync()
    },
    {
      scheduled: true,
      timezone: timezone
    }
  )

  return cronTask
}
