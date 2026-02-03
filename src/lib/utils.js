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

// Get rank info - ranks now have meaningful perks
export const RANKS = {
  Novice: {
    color: 'gray',
    icon: '🌱',
    xpMin: 0,
    xpMax: 499,
    perks: ['Basic task tracking', '3 tracks max'],
    maxTracks: 3,
    weeklyShields: 1
  },
  Apprentice: {
    color: 'green',
    icon: '🌿',
    xpMin: 500,
    xpMax: 1999,
    perks: ['4 tracks', '2 weekly shields', 'Basic stats'],
    maxTracks: 4,
    weeklyShields: 2
  },
  Journeyman: {
    color: 'blue',
    icon: '⚡',
    xpMin: 2000,
    xpMax: 4999,
    perks: ['5 tracks', '2 weekly shields', 'Detailed stats', 'Custom themes'],
    maxTracks: 5,
    weeklyShields: 2
  },
  Expert: {
    color: 'purple',
    icon: '💎',
    xpMin: 5000,
    xpMax: 9999,
    perks: ['6 tracks', '3 weekly shields', 'Community creation', 'Share cards'],
    maxTracks: 6,
    weeklyShields: 3
  },
  Master: {
    color: 'orange',
    icon: '🔥',
    xpMin: 10000,
    xpMax: 24999,
    perks: ['8 tracks', '3 weekly shields', 'Advanced analytics', 'Priority support'],
    maxTracks: 8,
    weeklyShields: 3
  },
  Grandmaster: {
    color: 'yellow',
    icon: '👑',
    xpMin: 25000,
    xpMax: 49999,
    perks: ['10 tracks', '4 weekly shields', 'Beta features', 'Profile badge'],
    maxTracks: 10,
    weeklyShields: 4
  },
  Legend: {
    color: 'pink',
    icon: '🌟',
    xpMin: 50000,
    xpMax: Infinity,
    perks: ['Unlimited tracks', '5 weekly shields', 'All features', 'Legend badge'],
    maxTracks: 999,
    weeklyShields: 5
  }
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

export const getPreviousRank = (rank) => {
  const rankOrder = Object.keys(RANKS)
  const currentIndex = rankOrder.indexOf(rank)
  if (currentIndex > 0) {
    return rankOrder[currentIndex - 1]
  }
  return null
}

// Get rank from XP
export const getRankFromXP = (xp) => {
  const rankOrder = Object.keys(RANKS)
  for (let i = rankOrder.length - 1; i >= 0; i--) {
    if (xp >= RANKS[rankOrder[i]].xpMin) {
      return rankOrder[i]
    }
  }
  return 'Novice'
}

// Calculate XP penalty for a single strike (10% of rank's total XP range)
export const calculateSingleStrikePenalty = (rank) => {
  const info = getRankInfo(rank)
  const rankXP = info.xpMax === Infinity ? 50000 : (info.xpMax - info.xpMin + 1)
  return Math.floor(rankXP * 0.1)
}

// Calculate XP penalty when ALL strikes are exhausted (50% of rank's total XP)
export const calculateStrikePenalty = (rank) => {
  const info = getRankInfo(rank)
  const rankXP = info.xpMax === Infinity ? 50000 : (info.xpMax - info.xpMin + 1)
  return Math.floor(rankXP * 0.5)
}

// Calculate XP for derank (halfway through previous rank)
export const calculateDerankXP = (rank) => {
  const prevRank = getPreviousRank(rank)
  if (!prevRank) return 0
  const prevInfo = RANKS[prevRank]
  return Math.floor(prevInfo.xpMin + (prevInfo.xpMax - prevInfo.xpMin) * 0.5)
}

// Journey types (Pro feature)
export const JOURNEY_TYPES = {
  fitness: {
    label: 'Fitness',
    icon: 'Dumbbell',
    color: 'green',
    description: 'Track workouts, PRs, and fitness goals'
  },
  academic: {
    label: 'Academic',
    icon: 'GraduationCap',
    color: 'blue',
    description: 'Track study sessions, exams, and grades'
  },
  creative: {
    label: 'Creative',
    icon: 'Palette',
    color: 'pink',
    description: 'Track art, music, writing projects'
  },
  language: {
    label: 'Language',
    icon: 'Languages',
    color: 'purple',
    description: 'Track language learning progress'
  }
}

// Strike settings
export const STRIKE_SETTINGS = {
  0: { label: 'Off', description: 'No strike system' },
  1: { label: '1 Strike', description: 'One chance per week' },
  3: { label: '3 Strikes', description: 'Standard difficulty' },
  999: { label: 'Unlimited', description: 'No penalty for missed days' }
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
  strike_used: { label: 'Strike Used', color: 'orange', bgColor: 'bg-orange-500/20' },
  missed: { label: 'Missed', color: 'red', bgColor: 'bg-red-500/20' },
  skipped: { label: 'Skipped', color: 'gray', bgColor: 'bg-gray-500/20' }
}

export const getStatusInfo = (status) => STATUS_INFO[status] || STATUS_INFO.pending

// Community activity types
export const ACTIVITY_TYPES = {
  task_created: { label: 'created a task', icon: 'Plus' },
  task_completed: { label: 'completed a task', icon: 'CheckCircle2' },
  task_started: { label: 'started a task', icon: 'Play' },
  task_deleted: { label: 'removed a task', icon: 'Trash2' },
  streak_milestone: { label: 'reached a streak milestone', icon: 'Flame' },
  rank_up: { label: 'ranked up', icon: 'TrendingUp' },
  joined_community: { label: 'joined the community', icon: 'UserPlus' }
}

// Task proposal statuses
export const PROPOSAL_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  accepted: { label: 'Accepted', color: 'green' },
  declined: { label: 'Declined', color: 'red' }
}

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

// Strike used messages
export const STRIKE_MESSAGES = [
  "Strike used - back at it tomorrow!",
  "Everyone needs a break sometimes",
  "One strike down, stay focused!",
  "Rest today, conquer tomorrow!",
  "Strike logged - don't make it a habit!"
]

export const getRandomStrikeMessage = () => {
  return STRIKE_MESSAGES[Math.floor(Math.random() * STRIKE_MESSAGES.length)]
}

// Derank messages
export const DERANK_MESSAGES = [
  "Rank lost! Time to grind back up.",
  "Setback, not defeat. Rise again!",
  "You've fallen, but legends bounce back.",
  "Lost rank - use this as motivation!"
]

export const getRandomDerankMessage = () => {
  return DERANK_MESSAGES[Math.floor(Math.random() * DERANK_MESSAGES.length)]
}

// Get week number for strike tracking
export const getWeekNumber = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

export const getWeekKey = (date = new Date()) => {
  return `${date.getFullYear()}-W${getWeekNumber(date)}`
}
