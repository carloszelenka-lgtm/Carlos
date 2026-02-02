// Local storage implementation for offline-first / demo mode
// This allows the app to work without Supabase for testing

const STORAGE_PREFIX = 'streakos_'

const getStorageKey = (key) => `${STORAGE_PREFIX}${key}`

const parseJSON = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback
  } catch {
    return fallback
  }
}

export const localStore = {
  // Generic CRUD operations
  get: (key) => {
    const data = localStorage.getItem(getStorageKey(key))
    return parseJSON(data, [])
  },

  set: (key, data) => {
    localStorage.setItem(getStorageKey(key), JSON.stringify(data))
  },

  getOne: (key, id) => {
    const items = localStore.get(key)
    return items.find(item => item.id === id) || null
  },

  insert: (key, item) => {
    const items = localStore.get(key)
    const newItem = {
      ...item,
      id: item.id || crypto.randomUUID(),
      created_at: item.created_at || new Date().toISOString()
    }
    items.push(newItem)
    localStore.set(key, items)
    return newItem
  },

  update: (key, id, updates) => {
    const items = localStore.get(key)
    const index = items.findIndex(item => item.id === id)
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() }
      localStore.set(key, items)
      return items[index]
    }
    return null
  },

  delete: (key, id) => {
    const items = localStore.get(key)
    const filtered = items.filter(item => item.id !== id)
    localStore.set(key, filtered)
    return true
  },

  query: (key, predicate) => {
    const items = localStore.get(key)
    return items.filter(predicate)
  },

  // User-specific helpers
  getCurrentUser: () => {
    const user = localStorage.getItem(getStorageKey('current_user'))
    return parseJSON(user, null)
  },

  setCurrentUser: (user) => {
    localStorage.setItem(getStorageKey('current_user'), JSON.stringify(user))
  },

  clearCurrentUser: () => {
    localStorage.removeItem(getStorageKey('current_user'))
  },

  // Bulk operations
  clear: (key) => {
    localStorage.removeItem(getStorageKey(key))
  },

  clearAll: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  }
}

// Tables matching Supabase schema
export const TABLES = {
  USERS_PROFILE: 'users_profile',
  TRACKS: 'tracks',
  QUESTS: 'quests',
  QUEST_LOGS: 'quest_logs',
  STREAKS: 'streaks',
  SHARE_CARDS: 'share_cards',
  REPORTS: 'reports',
  FEATURE_FLAGS: 'feature_flags',
  COMMUNITIES: 'communities',
  COMMUNITY_MEMBERS: 'community_members',
  COMMUNITY_MESSAGES: 'community_messages'
}
