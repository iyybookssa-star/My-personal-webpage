import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    // Singleton — always one document with this key
    key: { type: String, default: 'main', unique: true },
    visits: { type: Number, default: 0 },

    // Colors
    accentColor:           { type: String, default: '#4f81ff' },
    backgroundColor:       { type: String, default: '#141313' },
    surfaceColor:          { type: String, default: '#1c1b1b' },
    onSurfaceColor:        { type: String, default: '#e5e2e1' },
    onSurfaceVariantColor: { type: String, default: '#c4c7c7' },
    secondaryColor:        { type: String, default: '#c6c7c2' },

    // Typography
    headingFont:       { type: String, default: 'Playfair Display' },
    bodyFont:          { type: String, default: 'Hanken Grotesk' },
    displayFontSize:   { type: Number, default: 64 },
    headlineFontSize:  { type: Number, default: 32 },
    bodyFontSize:      { type: Number, default: 16 },

    // Layout
    borderRadius: { type: String, default: '0.25' },
    sectionGap:   { type: String, default: '120' },
    cardStyle:    { type: String, enum: ['grid', 'list'], default: 'grid' },

    // Site content
    siteTitle:  { type: String, default: 'Ibrahim’s Digest' },
    footerCopy: { type: String, default: '© 2024 Digital Curator Archive' },

    // Home content
    heroLabel:     { type: String, default: 'Archive 01' },
    heroTitle:     { type: String, default: 'A curated space for the things I love.' },
    heroSubtitle:  { type: String, default: 'Documenting thoughts on cinema, literature, and digital landscapes.' },
    watchingTitle: { type: String, default: 'Currently Watching' },
    libraryTitle:  { type: String, default: 'In the Library' },
    thoughtsTitle: { type: String, default: 'Recent Thoughts' },

    // Page content
    filmPageTitle:    { type: String, default: 'Film Archive' },
    filmPageDesc:     { type: String, default: 'An archival record of narratives experienced, worlds explored, and the lingering thoughts left behind.' },
    gamesPageTitle:   { type: String, default: 'Games Archive' },
    gamesPageDesc:    { type: String, default: 'A meticulous catalog of interactive digital experiences.' },
    booksPageTitle:   { type: String, default: 'The Library' },
    booksPageDesc:    { type: String, default: 'A curated collection of volumes shaping perspective.' },
    journalPageTitle: { type: String, default: 'Notes from the Archive' },
    journalPageDesc:  { type: String, default: 'A collection of thoughts, reflections, and deep dives.' },
    letterboxdUsername: { type: String, default: '' },
    hasSeeded: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('Settings', settingsSchema)
