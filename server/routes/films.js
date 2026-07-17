import express from 'express'
import { execSync } from 'child_process'
import Film from '../models/Film.js'

const router = express.Router()

// GET /api/films
router.get('/', async (req, res) => {
  try {
    const films = await Film.find().sort({ order: 1 })
    res.json(films)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/films
router.post('/', async (req, res) => {
  try {
    const lastItem = await Film.findOne().sort({ order: -1 })
    const nextOrder = lastItem ? lastItem.order + 1 : 0
    const film = await Film.create({ ...req.body, order: nextOrder })
    res.status(201).json(film)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/films/:id
router.put('/:id', async (req, res) => {
  try {
    const film = await Film.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(film)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/films/reorder
router.put('/reorder/list', async (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
  try {
    const promises = orderedIds.map((id, index) =>
      Film.findByIdAndUpdate(id, { order: index })
    )
    await Promise.all(promises)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET or POST /api/films/sync-letterboxd
router.all('/sync-letterboxd', async (req, res) => {
  const username = req.method === 'POST' ? req.body.username : req.query.username
  if (!username) {
    return res.status(400).json({ error: 'Username is required' })
  }

  const isStreaming = req.headers.accept === 'text/event-stream' || req.method === 'GET'

  if (isStreaming) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    })
    res.write('\n') // Keep connection alive
  }

  const sendUpdate = (data) => {
    if (isStreaming) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }

  try {
    sendUpdate({ type: 'status', message: `Fetching Letterboxd profile for ${username}...` })

    // Probe profile counts first
    let watchedCount = 0
    let watchlistCount = 0
    try {
      const profileHtml = execSync(`curl.exe -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "https://letterboxd.com/${username}/"`, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 })
      const watchedMatch = profileHtml.match(/<a href="\/[^/]+\/films\/"><span class="value">(\d+)<\/span>/)
      if (watchedMatch) watchedCount = parseInt(watchedMatch[1], 10)

      const watchlistMatch = profileHtml.match(/href="\/[^/]+\/watchlist\/" class="all-link">(\d+)<\/a>/)
      if (watchlistMatch) watchlistCount = parseInt(watchlistMatch[1], 10)
    } catch (e) {}

    sendUpdate({ type: 'info', watchedCount, watchlistCount })

    const ALL_DECADES = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', '1960s', '1950s', '1940s', '1930s', '1920s', '1910s', '1900s']
    const GENRES = [
      'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama',
      'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance',
      'science-fiction', 'thriller', 'war', 'western'
    ]

    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    const fetchHtml = (url) => {
      const cmd = `curl.exe -s -H "User-Agent: ${UA}" "${url}"`
      return execSync(cmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 })
    }

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

    const decodeHtmlEntities = (str) => str
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
          try { uid = JSON.parse(idMatch[1].replace(/&quot;/g, '"')).uid || '' } catch (e) {}
        }

        const pathMatch = attrs.match(/data-resolvable-poster-path='([^']+)'/)
        let cacheKey = ''
        if (pathMatch) {
          try { cacheKey = JSON.parse(pathMatch[1].replace(/&quot;/g, '"')).cacheBustingKey || '' } catch (e) {}
        }

        if (fullName && slug && uid) {
          const yearMatch = fullName.match(/\((\d{4})\)$/)
          const year = yearMatch ? yearMatch[1] : ''
          const title = fullName.replace(/\s*\(\d{4}\)$/, '').trim()
          const idNum = uid.replace('film:', '')
          const digits = idNum.split('').join('/')
          const img = `https://a.ltrbxd.com/resized/film-poster/${digits}/${idNum}-${slug}-0-230-0-345-crop.jpg?v=${cacheKey}`
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

    for (const decade of ALL_DECADES) {
      const decadeBase = `https://letterboxd.com/${username}/films/decade/${decade}/`
      sendUpdate({ type: 'status', message: `Probing decade ${decade}...` })

      let decadePage1Films = []
      let decadePage1Html = ''
      try {
        decadePage1Html = fetchHtml(decadeBase)
        decadePage1Films = parseFilmsFromHtml(decadePage1Html)
      } catch (e) {}

      if (decadePage1Films.length === 0) continue

      if (decadePage1Films.length < 72) {
        const totalPages = getPageCount(decadePage1Html)
        allFilms.push(...decadePage1Films)
        for (let p = 2; p <= totalPages; p++) {
          try {
            sendUpdate({ type: 'status', message: `Scraping page ${p} of ${totalPages} for decade ${decade}...` })
            allFilms.push(...parseFilmsFromHtml(fetchHtml(`${decadeBase}page/${p}/`)))
          } catch (e) {}
        }
      } else {
        for (const genre of GENRES) {
          const genreBase = `https://letterboxd.com/${username}/films/decade/${decade}/genre/${genre}/`
          allFilms.push(...fetchAllPages(genreBase, `${decade}/${genre}`))
        }
      }
    }

    // Watchlist scrape
    sendUpdate({ type: 'status', message: `Scraping watchlist...` })
    const watchlistFilms = []
    const watchlistBase = `https://letterboxd.com/${username}/watchlist/`
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

    sendUpdate({ type: 'status', message: `Analyzing duplicates...` })

    const uniqueFilms = []
    const seen = new Set()
    for (const film of allFilms) {
      const key = `${film.title.toLowerCase()}_${film.year}`
      if (!seen.has(key)) { seen.add(key); uniqueFilms.push(film) }
    }

    const uniqueWatchlist = []
    const wSeen = new Set()
    for (const film of watchlistFilms) {
      const key = `${film.title.toLowerCase()}_${film.year}`
      if (!wSeen.has(key)) { wSeen.add(key); uniqueWatchlist.push(film) }
    }

    sendUpdate({ type: 'status', message: `Syncing with database...` })

    let addedCount = 0
    const lastItem = await Film.findOne().sort({ order: -1 })
    let nextOrder = lastItem ? lastItem.order + 1 : 0

    // Insert watched first
    for (const item of [...uniqueFilms].reverse()) {
      const exists = await Film.findOne({
        title: { $regex: new RegExp(`^${item.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        year: item.year
      })

      if (exists) {
        sendUpdate({ type: 'film', film: exists, isNew: false })
        continue
      }

      let finalImg = item.img
      try {
        if (item.img && item.img.startsWith('http')) {
          const checkCmd = `curl.exe -I -s -o NUL -w "%{http_code}" "${item.img}"`
          const code = execSync(checkCmd, { encoding: 'utf-8' }).trim()
          if (code === '404') {
            const pngImg = item.img.replace('-crop.jpg', '-crop.png')
            const checkPngCmd = `curl.exe -I -s -o NUL -w "%{http_code}" "${pngImg}"`
            const pngCode = execSync(checkPngCmd, { encoding: 'utf-8' }).trim()
            if (pngCode === '200') {
              finalImg = pngImg
            }
          }
        }
      } catch (e) {}

      const newFilm = await Film.create({
        title: item.title,
        year: item.year,
        category: 'Recently Watched',
        img: finalImg || 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80',
        order: nextOrder++
      })
      sendUpdate({ type: 'film', film: newFilm, isNew: true })
      addedCount++
    }

    // Insert watchlist
    for (const item of [...uniqueWatchlist].reverse()) {
      const exists = await Film.findOne({
        title: { $regex: new RegExp(`^${item.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
        year: item.year
      })

      if (exists) {
        sendUpdate({ type: 'film', film: exists, isNew: false })
        continue
      }

      let finalImg = item.img
      try {
        if (item.img && item.img.startsWith('http')) {
          const checkCmd = `curl.exe -I -s -o NUL -w "%{http_code}" "${item.img}"`
          const code = execSync(checkCmd, { encoding: 'utf-8' }).trim()
          if (code === '404') {
            const pngImg = item.img.replace('-crop.jpg', '-crop.png')
            const checkPngCmd = `curl.exe -I -s -o NUL -w "%{http_code}" "${pngImg}"`
            const pngCode = execSync(checkPngCmd, { encoding: 'utf-8' }).trim()
            if (pngCode === '200') {
              finalImg = pngImg
            }
          }
        }
      } catch (e) {}

      const newFilm = await Film.create({
        title: item.title,
        year: item.year,
        category: 'Watchlist',
        img: finalImg || 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=400&q=80',
        order: nextOrder++
      })
      sendUpdate({ type: 'film', film: newFilm, isNew: true })
      addedCount++
    }

    sendUpdate({ type: 'done', success: true, addedCount, watchlistCount: uniqueWatchlist.length })

    if (isStreaming) {
      res.end()
    } else {
      res.json({ success: true, addedCount, watchlistCount: uniqueWatchlist.length })
    }

  } catch (err) {
    if (isStreaming) {
      sendUpdate({ type: 'error', error: err.message })
      res.end()
    } else {
      res.status(500).json({ error: err.message })
    }
  }
})

// DELETE /api/films/:id
router.delete('/:id', async (req, res) => {
  try {
    const ids = req.params.id.split(',').map(id => id.trim()).filter(Boolean)
    if (ids.length > 1) {
      await Film.deleteMany({ _id: { $in: ids } })
    } else if (ids.length === 1) {
      await Film.findByIdAndDelete(ids[0])
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
