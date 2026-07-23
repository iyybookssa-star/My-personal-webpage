import { useState, useEffect } from 'react'
import { useAdmin } from '../../context/AdminContext'

type CollectionType = 'films' | 'games' | 'books' | 'journals'

interface BaseItem {
  _id: string
  title: string
  category: string | string[]
  img: string
  order: number
  [key: string]: any
}

export default function CollectionPanel() {
  const { settings, updateSetting } = useAdmin()
  const [collection, setCollection] = useState<CollectionType>('films')
  const [letterboxdUser, setLetterboxdUser] = useState(settings.letterboxdUsername || '')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Sync letterboxdUser input state with settings once loaded
  useEffect(() => {
    if (settings.letterboxdUsername) {
      setLetterboxdUser(settings.letterboxdUsername)
    }
  }, [settings.letterboxdUsername])
  const [items, setItems] = useState<BaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<BaseItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [adminSearch, setAdminSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncProgress, setSyncProgress] = useState<{ total: number; current: number; status: string } | null>(null)

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = (filteredIds: string[]) => {
    // If all matching ids are currently selected, clear them. Otherwise, select all.
    const allSelected = filteredIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)))
    } else {
      setSelectedIds((prev) => {
        const next = [...prev]
        for (const id of filteredIds) {
          if (!next.includes(id)) next.push(id)
        }
        return next
      })
    }
  }

  const handleDeleteSelected = async (filteredIds: string[]) => {
    const toDelete = selectedIds.filter((id) => filteredIds.includes(id))
    if (toDelete.length === 0) return
    if (!window.confirm(`Are you sure you want to delete ${toDelete.length} selected item(s)?`)) return
    try {
      const res = await fetch(`/api/${collection}/${toDelete.join(',')}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => !toDelete.includes(id)))
        fetchItems()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [img, setImg] = useState('')
  const [year, setYear] = useState('')
  // Games
  const [studio, setStudio] = useState('')
  const [rating, setRating] = useState('5')
  const [desc, setDesc] = useState('')
  // Books
  const [pages, setPages] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  // Journal
  const [date, setDate] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/${collection}`)
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [collection])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = { title, category, img }

    if (collection === 'films') {
      payload.year = year
    } else if (collection === 'games') {
      payload.year = year
      payload.studio = studio
      payload.rating = Number(rating)
      payload.desc = desc
    } else if (collection === 'books') {
      payload.pages = pages
      payload.year = year
      payload.desc = desc
      payload.isCurrent = isCurrent
    } else if (collection === 'journals') {
      payload.date = date
      payload.desc = desc
      payload.isFeatured = isFeatured
    }

    try {
      const res = await fetch(`/api/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowAddModal(false)
        resetForm()
        fetchItems()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleStartEdit = (item: BaseItem) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setCategory(item.category || '')
    setImg(item.img || '')
    setYear(item.year || '')
    setStudio(item.studio || '')
    setRating(String(item.rating || '5'))
    setDesc(item.desc || '')
    setPages(item.pages || '')
    setIsCurrent(!!item.isCurrent)
    setDate(item.date || '')
    setIsFeatured(!!item.isFeatured)
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    const payload: any = { title, category, img }

    if (collection === 'films') {
      payload.year = year
    } else if (collection === 'games') {
      payload.year = year
      payload.studio = studio
      payload.rating = Number(rating)
      payload.desc = desc
    } else if (collection === 'books') {
      payload.pages = pages
      payload.year = year
      payload.desc = desc
      payload.isCurrent = isCurrent
    } else if (collection === 'journals') {
      payload.date = date
      payload.desc = desc
      payload.isFeatured = isFeatured
    }

    try {
      const res = await fetch(`/api/${collection}/${editingItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setShowEditModal(false)
        setEditingItem(null)
        resetForm()
        fetchItems()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      const res = await fetch(`/api/${collection}/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) fetchItems()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1
    if (nextIndex < 0 || nextIndex >= items.length) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[nextIndex]
    newItems[nextIndex] = temp

    setItems(newItems)

    try {
      await fetch(`/api/${collection}/reorder/list`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: newItems.map((item) => item._id) }),
      })
    } catch (err) {
      console.error('Failed to save reorder:', err)
      fetchItems() // Revert
    }
  }

  const handleToggleAutoSync = async () => {
    const nextState = !(settings.autoSyncEnabled ?? true)
    await updateSetting('autoSyncEnabled', nextState)
  }

  const handleLetterboxdSync = async () => {
    if (!letterboxdUser.trim()) {
      setSyncMessage('Please enter a valid Letterboxd username.')
      return
    }

    setSyncing(true)
    setSyncProgress({ total: 0, current: 0, status: 'Initializing Letterboxd connection...' })
    setSyncMessage('Saving username and starting real-time sync...')

    try {
      // 1. Save username to MongoDB settings
      await updateSetting('letterboxdUsername', letterboxdUser.trim())

      // 2. Start EventSource connection for real-time progress streaming
      const url = `/api/films/sync-letterboxd?username=${encodeURIComponent(letterboxdUser.trim())}`
      const ev = new EventSource(url)

      ev.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'status') {
            setSyncProgress((prev) => prev ? { ...prev, status: data.message } : { total: 0, current: 0, status: data.message })
            setSyncMessage(data.message)
          } 
          
          else if (data.type === 'info') {
            setSyncProgress({
              total: (data.watchedCount || 0) + (data.watchlistCount || 0),
              current: 0,
              status: 'Scraping film list pages...'
            })
          } 
          
          else if (data.type === 'film') {
            // If it is a newly inserted film, prepend it immediately to the local UI items list!
            if (data.isNew) {
              setItems((prev) => {
                if (prev.some((x) => x._id === data.film._id)) return prev
                return [data.film, ...prev]
              })
              setSyncProgress((prev) => {
                if (!prev) return null
                return { ...prev, current: prev.current + 1 }
              })
            } else if (data.isUpdated) {
              setItems((prev) =>
                prev.map((item) => (item._id === data.film._id ? data.film : item))
              )
            }
          } 
          
          else if (data.type === 'done') {
            const wlMsg = data.watchlistCount ? ` (${data.watchlistCount} from watchlist)` : ''
            const upMsg = data.updatedCount ? `, updated ${data.updatedCount} film state(s)` : ''
            setSyncMessage(`Successfully synced! Added ${data.addedCount} new film(s)${upMsg}${wlMsg}.`)
            setSyncing(false)
            setSyncProgress(null)
            ev.close()
            fetchItems() // Final complete refresh
          } 
          
          else if (data.type === 'error') {
            setSyncMessage(`Error: ${data.error || 'Failed to sync'}`)
            setSyncing(false)
            setSyncProgress(null)
            ev.close()
          }
        } catch (err) {
          console.error('Error parsing SSE event data:', err)
        }
      }

      ev.onerror = () => {
        setSyncMessage('Error streaming sync updates. The server connection may have closed.')
        setSyncing(false)
        setSyncProgress(null)
        ev.close()
      }

    } catch (err: any) {
      console.error(err)
      setSyncMessage('Error connecting to sync service. Is the server running?')
      setSyncing(false)
      setSyncProgress(null)
    }
  }

  const resetForm = () => {
    setTitle('')
    setCategory('')
    setImg('')
    setYear('')
    setStudio('')
    setRating('5')
    setDesc('')
    setPages('')
    setIsCurrent(false)
    setDate('')
    setIsFeatured(false)
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Collection Manager</h2>
          <p>Add, delete, or change order of cards on your website pages.</p>
        </div>
        <button className="admin-gate-btn" style={{ margin: 0 }} onClick={() => { resetForm(); setShowAddModal(true) }}>
          + Add New Item
        </button>
      </div>

      {/* Select collection */}
      <div className="collection-selector-tabs">
        {(['films', 'games', 'books', 'journals'] as CollectionType[]).map((type) => (
          <button
            key={type}
            className={`collection-tab-btn${collection === type ? ' active' : ''}`}
            onClick={() => { setCollection(type); setAdminSearch(''); setSelectedIds([]); }}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Letterboxd Sync Widget */}
      {collection === 'films' && (
        <div className="admin-section" style={{ border: '1px solid var(--surface-container-low)', padding: '20px', borderRadius: 'var(--radius)', marginBottom: '24px', backgroundColor: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="admin-section-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💚</span> Letterboxd Account Sync & Scheduled 12 AM Cron
            </h3>
            
            {/* Daily 12 AM schedule status badge & toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-container-low)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: settings.autoSyncEnabled !== false ? '#4caf50' : '#ff9800' }} />
              <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
                Daily 12:00 AM Auto-Sync: {settings.autoSyncEnabled !== false ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={handleToggleAutoSync}
                style={{
                  background: settings.autoSyncEnabled !== false ? 'rgba(255,152,0,0.15)' : 'rgba(76,175,80,0.15)',
                  color: settings.autoSyncEnabled !== false ? '#ff9800' : '#4caf50',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '3px 10px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                {settings.autoSyncEnabled !== false ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: '1.4' }}>
            Enter your Letterboxd username to import your watched films. Automatically runs every day at <b>12:00 AM (Midnight)</b>.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="admin-input"
              style={{ maxWidth: '300px', margin: 0 }}
              placeholder="Letterboxd Username (e.g. dave)"
              value={letterboxdUser}
              onChange={(e) => setLetterboxdUser(e.target.value)}
            />
            <button
              className="admin-gate-btn"
              style={{ margin: 0, height: '42px', padding: '0 20px' }}
              disabled={syncing}
              onClick={handleLetterboxdSync}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          {settings.lastSyncedAt && (
            <p style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>
              🕒 Last 12 AM auto-sync: <b>{new Date(settings.lastSyncedAt).toLocaleString()}</b>
              {settings.lastSyncCount !== undefined ? ` (${settings.lastSyncCount} new items imported)` : ''}
            </p>
          )}

          {syncMessage && (
            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: syncMessage.toLowerCase().includes('error') ? '#ff5252' : '#4caf50' }}>
              {syncMessage}
            </p>
          )}
          {syncing && syncProgress && syncProgress.total > 0 && (
            <div style={{ marginTop: '16px', maxWidth: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
                <span>Importing new films: {syncProgress.current} / {syncProgress.total}</span>
                <span>{Math.round((syncProgress.current / syncProgress.total) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--surface-container-high)', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, (syncProgress.current / syncProgress.total) * 100)}%`, 
                    height: '100%', 
                    background: 'var(--primary, #4f81ff)', 
                    transition: 'width 0.4s ease' 
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items list with move arrows */}
      <div className="admin-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <h3 className="admin-section-title" style={{ margin: 0 }}>
            {collection.toUpperCase()} List ({items.length} items)
          </h3>
          <div className="search-input-wrapper" style={{ flex: '1', minWidth: '200px', maxWidth: '340px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="admin-collection-search"
              className="search-input"
              placeholder={`Search ${collection}...`}
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
            />
          </div>
        </div>
        {(() => {
          const searchLower = adminSearch.toLowerCase()
          const filteredItems = adminSearch
            ? items.filter(
                (item) =>
                  item.title.toLowerCase().includes(searchLower) ||
                  (Array.isArray(item.category) ? item.category.join(' ') : item.category || '').toLowerCase().includes(searchLower) ||
                  (item.year || '').includes(adminSearch)
              )
            : items

          return loading ? (
            <p className="admin-loading">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="admin-empty">No items found. Click "+ Add New Item" to populate this collection.</p>
          ) : filteredItems.length === 0 ? (
            <p className="admin-empty">No items match "{adminSearch}".</p>
          ) : (
            <>
              {/* Bulk selection / action bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius)', marginBottom: '16px', border: '1px solid var(--surface-container-low)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--on-surface)' }}>
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item._id))}
                    onChange={() => handleToggleSelectAll(filteredItems.map(item => item._id))}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span>Select All on page ({filteredItems.length})</span>
                </label>
                
                {selectedIds.some(id => filteredItems.map(item => item._id).includes(id)) && (
                  <button
                    className="subscriber-remove-btn"
                    onClick={() => handleDeleteSelected(filteredItems.map(item => item._id))}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '4px', background: '#ff5252', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    ✕ Delete Selected ({selectedIds.filter(id => filteredItems.map(item => item._id).includes(id)).length})
                  </button>
                )}
              </div>

              <style>{`
                @keyframes skeleton-pulse {
                  0% { opacity: 0.4; }
                  50% { opacity: 0.85; }
                  100% { opacity: 0.4; }
                }
                .skeleton-pulse {
                  animation: skeleton-pulse 1.5s infinite ease-in-out;
                }
                .skeleton-text-pulse {
                  animation: skeleton-pulse 1.5s infinite ease-in-out;
                }
              `}</style>

              <div className="ordering-list">
                {/* Real-time Loading Skeletons */}
                {syncing && syncProgress && syncProgress.current < syncProgress.total && (
                  Array.from({ length: Math.min(4, syncProgress.total - syncProgress.current) }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="ordering-row skeleton-pulse" style={{ display: 'flex', alignItems: 'center', opacity: 0.65, borderStyle: 'dashed', borderWidth: '1px', borderColor: 'var(--surface-container-high)' }}>
                      <input type="checkbox" disabled style={{ marginRight: '16px', width: '18px', height: '18px', opacity: 0.3 }} />
                      <div className="ordering-arrows" style={{ visibility: 'hidden' }}>
                        <button className="arrow-btn" disabled>▲</button>
                      </div>
                      <div className="ordering-item-img" style={{ backgroundColor: 'var(--surface-container-high)', backgroundImage: 'none', borderRadius: '4px' }} />
                      <div className="ordering-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="skeleton-text-pulse" style={{ width: '150px', height: '14px', backgroundColor: 'var(--surface-container-high)', borderRadius: '3px' }} />
                        <div className="skeleton-text-pulse" style={{ width: '80px', height: '10px', backgroundColor: 'var(--surface-container-high)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))
                )}

                {filteredItems.map((item, idx) => (
                  <div key={item._id} className="ordering-row" style={{ display: 'flex', alignItems: 'center' }}>
                    {/* Checkbox for bulk deletion selection */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => handleToggleSelect(item._id)}
                      style={{ marginRight: '16px', width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      title="Select for bulk delete"
                    />

                    {/* Reordering Controls */}
                    <div className="ordering-arrows">
                      <button
                        className="arrow-btn"
                        disabled={idx === 0}
                        onClick={() => handleMove(items.indexOf(item), 'up')}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        className="arrow-btn"
                        disabled={idx === filteredItems.length - 1}
                        onClick={() => handleMove(items.indexOf(item), 'down')}
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="ordering-item-img" style={{ backgroundImage: `url(${item.img})` }} />

                    <div className="ordering-item-details">
                      <span className="ordering-item-title">{item.title}</span>
                      <span className="ordering-item-meta">
                        {Array.isArray(item.category) ? item.category.join(' · ') : item.category} {item.year ? `· ${item.year}` : ''}
                      </span>
                    </div>

                    <button
                      className="arrow-btn"
                      onClick={() => handleStartEdit(item)}
                      title="Edit Item"
                      style={{ marginRight: '12px', fontSize: '0.95rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✎
                    </button>

                    <button className="subscriber-remove-btn" onClick={() => handleDelete(item._id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )
        })()
      }
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              ✕
            </button>
            <h2 className="modal-title">Add to {collection.toUpperCase()}</h2>

            <form onSubmit={handleAdd} className="modal-form" style={{ marginTop: '20px' }}>
              <div className="modal-input-group">
                <label className="modal-label">Title</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Category</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  placeholder="e.g. Favorites, Recently Played, Philosophy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Image URL</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                />
              </div>

              {/* Conditional fields based on collection type */}
              {(collection === 'films' || collection === 'games' || collection === 'books') && (
                <div className="modal-input-group">
                  <label className="modal-label">Year</label>
                  <input
                    type="text"
                    className="modal-input"
                    required
                    placeholder="e.g. 2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
              )}

              {collection === 'games' && (
                <>
                  <div className="modal-input-group">
                    <label className="modal-label">Studio</label>
                    <input
                      type="text"
                      className="modal-input"
                      required
                      placeholder="Remedy Entertainment"
                      value={studio}
                      onChange={(e) => setStudio(e.target.value)}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label className="modal-label">Rating (1 to 5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.5}
                      className="modal-input"
                      required
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    />
                  </div>
                </>
              )}

              {collection === 'books' && (
                <div className="modal-input-group">
                  <label className="modal-label">Pages</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. 350 pages"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                </div>
              )}

              {collection === 'journals' && (
                <div className="modal-input-group">
                  <label className="modal-label">Display Date</label>
                  <input
                    type="text"
                    className="modal-input"
                    required
                    placeholder="e.g. Oct 18, 2024"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              )}

              {(collection === 'games' || collection === 'books' || collection === 'journals') && (
                <div className="modal-input-group">
                  <label className="modal-label">Description</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              )}

              {collection === 'books' && (
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                  />
                  Mark as "Currently Reading"
                </label>
              )}

              {collection === 'journals' && (
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  Mark as "Featured Post" (Main Hero Post)
                </label>
              )}

              <button type="submit" className="modal-submit-btn">
                Add Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingItem(null); resetForm(); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => { setShowEditModal(false); setEditingItem(null); resetForm(); }}>
              ✕
            </button>
            <h2 className="modal-title">Edit Item</h2>

            <form onSubmit={handleUpdate} className="modal-form" style={{ marginTop: '20px' }}>
              <div className="modal-input-group">
                <label className="modal-label">Title</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Category</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  placeholder="e.g. Favorites, Recently Watched, Philosophy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Image URL</label>
                <input
                  type="text"
                  className="modal-input"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={img}
                  onChange={(e) => setImg(e.target.value)}
                />
              </div>

              {/* Conditional fields based on collection type */}
              {(collection === 'films' || collection === 'games' || collection === 'books') && (
                <div className="modal-input-group">
                  <label className="modal-label">Year</label>
                  <input
                    type="text"
                    className="modal-input"
                    required
                    placeholder="e.g. 2024"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
              )}

              {collection === 'games' && (
                <>
                  <div className="modal-input-group">
                    <label className="modal-label">Studio</label>
                    <input
                      type="text"
                      className="modal-input"
                      required
                      placeholder="Remedy Entertainment"
                      value={studio}
                      onChange={(e) => setStudio(e.target.value)}
                    />
                  </div>
                  <div className="modal-input-group">
                    <label className="modal-label">Rating (1 to 5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.5}
                      className="modal-input"
                      required
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    />
                  </div>
                </>
              )}

              {collection === 'books' && (
                <div className="modal-input-group">
                  <label className="modal-label">Pages</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. 350 pages"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                </div>
              )}

              {collection === 'journals' && (
                <div className="modal-input-group">
                  <label className="modal-label">Display Date</label>
                  <input
                    type="text"
                    className="modal-input"
                    required
                    placeholder="e.g. Oct 18, 2024"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              )}

              {(collection === 'games' || collection === 'books' || collection === 'journals') && (
                <div className="modal-input-group">
                  <label className="modal-label">Description</label>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              )}

              {collection === 'books' && (
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                  />
                  Mark as "Currently Reading"
                </label>
              )}

              {collection === 'journals' && (
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  Mark as "Featured Post" (Main Hero Post)
                </label>
              )}

              <button type="submit" className="modal-submit-btn">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
