import { execSync } from 'child_process'
import Film from '../models/Film.js'
import Settings from '../models/Settings.js'

/**
 * Runs the Letterboxd data sync for a given username.
 * @param {Object} options
 * @param {string} options.username Letterboxd username to sync
 * @param {Function} [options.sendUpdate] Callback for streaming progress events
 * @returns {Promise<{ success: boolean, addedCount: number, watchlistCount: number }>}
 */
export async function syncLetterboxdData({ username, sendUpdate = () => {} }) {
  if (!username || !username.trim()) {
    throw new Error('Username is required for Letterboxd sync')
  }

  const cleanUsername = username.trim()

  // Update Settings sync status to running
  await Settings.findOneAndUpdate(
    { key: 'main' },
    {
      $set: {
        lastSyncStatus: 'running',
        lastSyncMessage: `Syncing profile for ${cleanUsername}...`
      }
    },
    { upsert: true }
  )

  try {
    sendUpdate({ type: 'status', message: `Fetching Letterboxd profile for ${cleanUsername}...` })

    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    const fetchHtml = (url) => {
      const curlBin = process.platform === 'win32' ? 'curl.exe' : 'curl'
      try {
        const cmd = `${curlBin} -s -L -H "User-Agent: ${UA}" "${url}"`
        return execSync(cmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 })
      } catch (e) {
        console.warn(`execSync ${curlBin} failed, attempting Node fetch fallback:`, e.message)
        try {
          const nodeCmd = `node -e "fetch('${url}', { headers: { 'User-Agent': '${UA}' } }).then(r => r.text()).then(t => process.stdout.write(t))"`
          return execSync(nodeCmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 })
        } catch (err2) {
          throw err2
        }
      }
    }

    // Probe profile counts first
    let watchedCount = 0
    let watchlistCount = 0
    try {
      const profileHtml = fetchHtml(`https://letterboxd.com/${cleanUsername}/`)
      const watchedMatch = profileHtml.match(/<a href="\/[^/]+\/films\/"><span class="value">(\d+)<\/span>/)
      if (watchedMatch) watchedCount = parseInt(watchedMatch[1], 10)

      const watchlistMatch = profileHtml.match(/href="\/[^/]+\/watchlist\/" class="all-link">(\d+)<\/a>/)
      if (watchlistMatch) watchlistCount = parseInt(watchlistMatch[1], 10)
    } catch (e) {
      console.warn('Could not probe Letterboxd counts:', e.message)
    }

    sendUpdate({ type: 'info', watchedCount, watchlistCount })

    const ALL_DECADES = [
      '2020s', '2010s', '2000s', '1990s', '1980s', '1970s',
      '1960s', '1950s', '1940s', '1930s', '1920s', '1910s', '1900s'
    ]
    const GENRES = [
      'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama',
      'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance',
      'science-fiction', 'thriller', 'war', 'western'
    ]

    const getPageCount = (html) => {
      const pageNumRegex = /paginate-page[^>]*><a[^>]*href="[^"]+\/page\/(\d+)\/">/g
      let max = 1
      let m
      while ((m = pageNumRegex.exec(html)) !== null) {
        const n = parseInt(m[1], 10)
        if (n > max) max = n
      }
      return max
    }

    const decodeHtmlEntities = (str) =>
      str
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')

    const parseFilmsFromHtml = (html) => {
      const list = []
      const componentRegex = /class="react-component"[^>]*data-component-class="LazyPoster"([\s\S]*?)>/g
      let compMatch

      while ((compMatch = componentRegex.exec(html)) !== null) {
        const attrs = compMatch[1]

        const nameMatch = attrs.match(/data-item-name="([^"]+)"/)
        const fullName = nameMatch ? decodeHtmlEntities(nameMatch[1]) : ''
        const slugMatch = attrs.match(/data-item-slug="([^"]+)"/)
        const slug = slugMatch ? slugMatch[1] : ''

        const idMatch = attrs.match(/data-postered-identifier='([^']+)'/)
        let uid = ''
        if (idMatch) {
          try {
            uid = JSON.parse(idMatch[1].replace(/&quot;/g, '"')).uid || ''
          } catch (e) {}
        }

        const pathMatch = attrs.match(/data-resolvable-poster-path='([^']+)'/)
        let cacheKey = ''
        if (pathMatch) {
          try {
            cacheKey = JSON.parse(pathMatch[1].replace(/&quot;/g, '"')).cacheBustingKey || ''
          } catch (e) {}
        }

        if (fullName && slug && uid) {
          const yearMatch = fullName.match(/\((\d{4})\)$/)
          const year = yearMatch ? yearMatch[1] : ''
          const title = fullName.replace(/\s*\(\d{4}\)$/, '').trim()
          const idNum = uid.replace('film:', '')
          const digits = idNum.split('').join('/')
          // Remove trailing year suffix from slug if present (e.g., 'the-irishman-2019' -> 'the-irishman')
          const cleanSlug = slug.replace(/-\d{4}$/, '')
          const img = `https://a.ltrbxd.com/resized/film-poster/${digits}/${idNum}-${cleanSlug}-0-230-0-345-crop.jpg?v=${cacheKey}`
          list.push({ title, year, img })
        }
      }
      return list
    }

    const fetchAllPages = (baseUrl, label) => {
      const pageFilms = []
      try {
        sendUpdate({ type: 'status', message: `Scraping page 1 for ${label}...` })
        const firstHtml = fetchHtml(baseUrl)
        pageFilms.push(...parseFilmsFromHtml(firstHtml))
        const totalPages = getPageCount(firstHtml)
        for (let p = 2; p <= totalPages; p++) {
          try {
            sendUpdate({ type: 'status', message: `Scraping page ${p} of ${totalPages} for ${label}...` })
            pageFilms.push(...parseFilmsFromHtml(fetchHtml(`${baseUrl}page/${p}/`)))
          } catch (e) {}
        }
      } catch (e) {}
      return pageFilms
    }

    const allFilms = []

    // RSS Feed scrape (fetches the 30 most recently logged films instantly in 1 request)
    sendUpdate({ type: 'status', message: `Fetching recent diary entries via RSS...` })
    try {
      const rssXml = fetchHtml(`https://letterboxd.com/${cleanUsername}/rss/`)
      const itemRegex = /<item>([\s\S]*?)<\/item>/g
      let itemMatch
      while ((itemMatch = itemRegex.exec(rssXml)) !== null) {
        const itemContent = itemMatch[1]
        const titleMatch = itemContent.match(/<letterboxd:filmTitle>(.*?)<\/letterboxd:filmTitle>/)
        const yearMatch = itemContent.match(/<letterboxd:filmYear>(.*?)<\/letterboxd:filmYear>/)
        const imgMatch = itemContent.match(/src="(https:\/\/a\.ltrbxd\.com\/resized\/film-poster\/[^"]+)"/)

        if (titleMatch && yearMatch) {
          const title = decodeHtmlEntities(titleMatch[1].trim())
          const year = yearMatch[1].trim()
          let img = imgMatch ? imgMatch[1] : ''
          if (img) img = resolvePosterUrl(img)
          allFilms.push({ title, year, img })
        }
      }
    } catch (e) {}

    for (const decade of ALL_DECADES) {
      const decadeBase = `https://letterboxd.com/${cleanUsername}/films/decade/${decade}/`
      sendUpdate({ type: 'status', message: `Probing decade ${decade}...` })

      try {
        const decadeHtml = fetchHtml(decadeBase)
        const decadeFilms = parseFilmsFromHtml(decadeHtml)
        if (decadeFilms.length > 0) {
          allFilms.push(...decadeFilms)
        }
      } catch (e) {}
    }

    // Watchlist scrape
    sendUpdate({ type: 'status', message: `Scraping watchlist...` })
    const watchlistFilms = []
    const watchlistBase = `https://letterboxd.com/${cleanUsername}/watchlist/`
    try {
      const wHtml = fetchHtml(watchlistBase)
      watchlistFilms.push(...parseFilmsFromHtml(wHtml))
      const wTotalPages = getPageCount(wHtml)
      for (let p = 2; p <= wTotalPages; p++) {
        try {
          sendUpdate({ type: 'status', message: `Scraping watchlist page ${p} of ${wTotalPages}...` })
          watchlistFilms.push(...parseFilmsFromHtml(fetchHtml(`${watchlistBase}page/${p}/`)))
        } catch (e) {}
      }
    } catch (e) {}

    // Likes scrape
    sendUpdate({ type: 'status', message: `Scraping liked films (Favorites)...` })
    const likedFilms = []
    const likesBase = `https://letterboxd.com/${cleanUsername}/likes/films/`
    try {
      const lHtml = fetchHtml(likesBase)
      likedFilms.push(...parseFilmsFromHtml(lHtml))
      const lTotalPages = getPageCount(lHtml)
      for (let p = 2; p <= lTotalPages; p++) {
        try {
          sendUpdate({ type: 'status', message: `Scraping likes page ${p} of ${lTotalPages}...` })
          likedFilms.push(...parseFilmsFromHtml(fetchHtml(`${likesBase}page/${p}/`)))
        } catch (e) {}
      }
    } catch (e) {}

    sendUpdate({ type: 'status', message: `Analyzing duplicates and multi-category mapping...` })

    const uniqueFilms = []
    const seen = new Set()
    for (const film of allFilms) {
      const key = `${film.title.toLowerCase()}_${film.year}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueFilms.push(film)
      }
    }

    const uniqueLikes = []
    const lSeen = new Set()
    for (const film of likedFilms) {
      const key = `${film.title.toLowerCase()}_${film.year}`
      if (!lSeen.has(key)) {
        lSeen.add(key)
        uniqueLikes.push(film)
      }
    }

    const uniqueWatchlist = []
    const wSeen = new Set()
    for (const film of watchlistFilms) {
      const key = `${film.title.toLowerCase()}_${film.year}`
      if (!wSeen.has(key)) {
        wSeen.add(key)
        uniqueWatchlist.push(film)
      }
    }

    sendUpdate({ type: 'status', message: `Loading and deduplicating database items for single-document multi-category mapping...` })
    const allDbFilms = await Film.find({})
    
    // Group existing DB records by title + year (lowercase)
    const dbFilmMap = new Map()
    for (const f of allDbFilms) {
      const key = `${f.title.toLowerCase()}_${f.year}`
      if (!dbFilmMap.has(key)) dbFilmMap.set(key, [])
      dbFilmMap.get(key).push(f)
    }

    // Merge any duplicate documents in MongoDB into 1 single film document with categories array
    for (const [key, docs] of dbFilmMap.entries()) {
      if (docs.length > 1) {
        const primary = docs[0]
        const allCats = new Set()
        for (const d of docs) {
          if (Array.isArray(d.category)) d.category.forEach(c => allCats.add(c))
          else if (d.category) allCats.add(d.category)
        }
        primary.category = Array.from(allCats)
        await primary.save()

        // Delete duplicate secondary documents
        for (let i = 1; i < docs.length; i++) {
          await Film.deleteOne({ _id: docs[i]._id })
        }
        dbFilmMap.set(key, [primary])
      }
    }

    // 1-to-1 lookup map: key -> single Film document
    const filmLookup = new Map()
    for (const [key, docs] of dbFilmMap.entries()) {
      filmLookup.set(key, docs[0])
    }

    let addedCount = 0
    let updatedCount = 0
    const lastItem = await Film.findOne().sort({ order: -1 })
    let nextOrder = lastItem ? lastItem.order + 1 : 0

    const resolvePosterUrl = (url) => {
      if (!url || !url.startsWith('http')) return 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80'
      // Instant string transformation: strip year suffix from poster filename slug (e.g., '-2019-0-' -> '-0-')
      return url.replace(/-\d{4}-0-/, '-0-')
    }

    // Gather target categories per scraped film key
    const scrapedTargetMap = new Map()

    for (const item of uniqueFilms) {
      const key = `${item.title.toLowerCase()}_${item.year}`
      if (!scrapedTargetMap.has(key)) scrapedTargetMap.set(key, { item, cats: new Set() })
      scrapedTargetMap.get(key).cats.add('Recently Watched')
    }

    for (const item of uniqueLikes) {
      const key = `${item.title.toLowerCase()}_${item.year}`
      if (!scrapedTargetMap.has(key)) scrapedTargetMap.set(key, { item, cats: new Set() })
      scrapedTargetMap.get(key).cats.add('Favorites')
    }

    for (const item of uniqueWatchlist) {
      const key = `${item.title.toLowerCase()}_${item.year}`
      if (!scrapedTargetMap.has(key)) scrapedTargetMap.set(key, { item, cats: new Set() })
      const target = scrapedTargetMap.get(key)
      if (!target.cats.has('Recently Watched') && !target.cats.has('Favorites')) {
        target.cats.add('Watchlist')
      }
    }

    // Process single film document updates/inserts
    for (const [key, { item, cats }] of scrapedTargetMap.entries()) {
      const existing = filmLookup.get(key)

      if (existing) {
        const currentCats = new Set(Array.isArray(existing.category) ? existing.category : [existing.category])
        let modified = false

        // Migrate state from Watchlist to Recently Watched if newly watched
        if (cats.has('Recently Watched') && currentCats.has('Watchlist')) {
          currentCats.delete('Watchlist')
          modified = true
        }

        for (const c of cats) {
          if (!currentCats.has(c)) {
            currentCats.add(c)
            modified = true
          }
        }

        const newCats = Array.from(currentCats)
        const finalCategory = newCats.length === 1 ? newCats[0] : newCats

        if (modified) {
          existing.category = finalCategory
          await existing.save()
          updatedCount++
          sendUpdate({ type: 'film', film: existing, isUpdated: true, isNew: false })
        } else {
          sendUpdate({ type: 'film', film: existing, isNew: false })
        }
      } else {
        const catArray = Array.from(cats)
        const finalCategory = catArray.length === 1 ? catArray[0] : catArray
        const finalImg = resolvePosterUrl(item.img)

        const newFilm = await Film.create({
          title: item.title,
          year: item.year,
          category: finalCategory,
          img: finalImg,
          order: nextOrder++
        })
        filmLookup.set(key, newFilm)
        sendUpdate({ type: 'film', film: newFilm, isNew: true })
        addedCount++
      }
    }

    const updatedMsg = updatedCount > 0 ? `, updated ${updatedCount} film state(s)` : ''
    const successMessage = `Daily 12 AM sync completed. Added ${addedCount} item(s)${updatedMsg} (${uniqueLikes.length} liked, ${uniqueWatchlist.length} watchlist).`
    sendUpdate({ type: 'done', success: true, addedCount, updatedCount, likesCount: uniqueLikes.length, watchlistCount: uniqueWatchlist.length })

    // Save final status in Settings
    await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'success',
          lastSyncMessage: successMessage,
          lastSyncCount: addedCount
        }
      },
      { upsert: true }
    )

    return { success: true, addedCount, watchlistCount: uniqueWatchlist.length }
  } catch (err) {
    const errorMsg = `Daily 12 AM sync failed: ${err.message}`
    console.error('Letterboxd sync error:', err)
    
    await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          lastSyncedAt: new Date(),
          lastSyncStatus: 'error',
          lastSyncMessage: errorMsg
        }
      },
      { upsert: true }
    )

    throw err
  }
}
