import { format, formatDistanceToNow, isToday, isYesterday, startOfWeek, endOfWeek, parseISO } from 'date-fns'

// Format date for display
export const formatDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

// Format time ago
export const formatTimeAgo = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

// Get week boundaries
export const getWeekBounds = (date = new Date()) => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 })
  }
}

// Format minutes to human readable
export const formatMinutes = (minutes) => {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Get rank info
export const RANKS = {
  Novice: { color: 'gray', icon: '🌱', xpMin: 0, xpMax: 499 },
  Apprentice: { color: 'green', icon: '🌿', xpMin: 500, xpMax: 1999 },
  Journeyman: { color: 'blue', icon: '⚡', xpMin: 2000, xpMax: 4999 },
  Expert: { color: 'purple', icon: '💎', xpMin: 5000, xpMax: 9999 },
  Master: { color: 'orange', icon: '🔥', xpMin: 10000, xpMax: 24999 },
  Grandmaster: { color: 'yellow', icon: '👑', xpMin: 25000, xpMax: 49999 },
  Legend: { color: 'pink', icon: '🌟', xpMin: 50000, xpMax: Infinity }
}

export const getRankInfo = (rank) => RANKS[rank] || RANKS.Novice

export const getRankProgress = (xp, rank) => {
  const info = getRankInfo(rank)
  const progress = (xp - info.xpMin) / (info.xpMax - info.xpMin + 1)
  return Math.min(Math.max(progress, 0), 1)
}

export const getNextRank = (rank) => {
  const rankOrder = Object.keys(RANKS)
  const currentIndex = rankOrder.indexOf(rank)
  if (currentIndex < rankOrder.length - 1) {
    return rankOrder[currentIndex + 1]
  }
  return null
}

// Intent colors and icons
export const INTENTS = {
  study: { color: 'blue', icon: 'BookOpen', label: 'Study' },
  fitness: { color: 'green', icon: 'Dumbbell', label: 'Fitness' },
  language: { color: 'purple', icon: 'Languages', label: 'Language' },
  creative: { color: 'pink', icon: 'Palette', label: 'Creative' },
  skill: { color: 'orange', icon: 'Target', label: 'Skill' },
  general: { color: 'gray', icon: 'Star', label: 'General' }
}

export const getIntentInfo = (intent) => INTENTS[intent] || INTENTS.general

// Difficulty labels
export const DIFFICULTY_LABELS = {
  1: 'Easy',
  2: 'Light',
  3: 'Moderate',
  4: 'Challenging',
  5: 'Intense'
}

// Status labels and colors
export const STATUS_INFO = {
  pending: { label: 'Pending', color: 'gray', bgColor: 'bg-gray-500/20' },
  in_progress: { label: 'In Progress', color: 'blue', bgColor: 'bg-blue-500/20' },
  completed: { label: 'Completed', color: 'green', bgColor: 'bg-green-500/20' },
  mvp_completed: { label: 'MVP Done', color: 'yellow', bgColor: 'bg-yellow-500/20' },
  failed: { label: 'Missed', color: 'red', bgColor: 'bg-red-500/20' },
  skipped: { label: 'Skipped', color: 'gray', bgColor: 'bg-gray-500/20' }
}

export const getStatusInfo = (status) => STATUS_INFO[status] || STATUS_INFO.pending

// Generate invite code
export const generateInviteCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Validate email
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validate username
export const isValidUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username)
}

// Truncate text
export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Class name helper
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

// Days of week
export const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' }
]

// Fun completion messages
export const COMPLETION_MESSAGES = [
  "You're on fire! 🔥",
  "Quest conquered! 💪",
  "Another one bites the dust!",
  "Legendary work!",
  "Keep stacking wins!",
  "Progress made!",
  "You showed up!",
  "Consistency is key!",
  "One step closer!",
  "Future you says thanks!"
]

export const getRandomCompletionMessage = () => {
  return COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]
}

// Fun MVP messages
export const MVP_MESSAGES = [
  "Progress is progress!",
  "Shield activated! 🛡️",
  "Streak saved!",
  "Showing up counts!",
  "Every bit matters!",
  "Tomorrow, go bigger!",
  "MVP but still victory!"
]

export const getRandomMVPMessage = () => {
  return MVP_MESSAGES[Math.floor(Math.random() * MVP_MESSAGES.length)]
}
