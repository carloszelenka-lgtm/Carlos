// Quest Engine - Deterministic template-based quest generation
// Works without AI for $0 operation

// Simple, clean instructions based on intent (used when no description provided)
const SIMPLE_INSTRUCTIONS = {
  study: (minutes) => `Focus for ${minutes} minutes. Eliminate distractions.`,
  fitness: (minutes) => `Complete a ${minutes}-minute session. Listen to your body.`,
  language: (minutes) => `Practice for ${minutes} minutes. Speak, read, or listen.`,
  creative: (minutes) => `Create for ${minutes} minutes. Focus on making, not perfecting.`,
  skill: (minutes) => `Practice deliberately for ${minutes} minutes.`,
  general: (minutes) => `Work focused for ${minutes} minutes.`
}

const SIMPLE_MVP = {
  study: `5-minute review: Look over your notes or materials.`,
  fitness: `5-minute movement: Light stretching or a quick walk.`,
  language: `3-minute practice: Review 5 words or say 5 sentences.`,
  creative: `5-minute sketch: Quick draft or brainstorm ideas.`,
  skill: `5-minute drill: Practice one fundamental.`,
  general: `5 minutes: Complete one small task.`
}

// Rich templates when user provides a description
const RICH_TEMPLATES = {
  study: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes}-minute focused session: ${desc}. Eliminate distractions and work with intention.`,
      mvp: (desc) => `5-minute quick review of your ${desc.toLowerCase()} materials.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Spend ${minutes} minutes on ${desc}. Test yourself without looking at notes.`,
      mvp: (desc) => `Write down 3 key things you remember about ${desc.toLowerCase()}.`
    }
  ],

  fitness: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes}-minute ${desc.toLowerCase()}. Focus on form and consistency.`,
      mvp: (desc) => `5-minute mobility: Light stretching to prepare for ${desc.toLowerCase()}.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Complete ${minutes} minutes of ${desc.toLowerCase()}. Stay present and enjoy the movement.`,
      mvp: () => `5-minute active recovery: Gentle stretching or a short walk.`
    }
  ],

  language: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes} minutes: ${desc}. Immerse yourself fully.`,
      mvp: (desc) => `3-minute practice: Quick ${desc.toLowerCase()} review.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Practice ${desc.toLowerCase()} for ${minutes} minutes. Speak out loud when possible.`,
      mvp: () => `3-minute speaking: Say 5 sentences out loud.`
    }
  ],

  creative: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes} minutes: ${desc}. Focus on creating, not perfecting.`,
      mvp: (desc) => `5-minute sketch: Quick rough draft for ${desc.toLowerCase()}.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Work on ${desc.toLowerCase()} for ${minutes} minutes. Let creativity flow.`,
      mvp: () => `5-minute brainstorm: Jot down 3 new ideas.`
    }
  ],

  skill: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes} minutes of deliberate practice: ${desc}`,
      mvp: (desc) => `5-minute drill: Quick focused practice on ${desc.toLowerCase()}.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Practice ${desc.toLowerCase()} for ${minutes} minutes. Challenge yourself.`,
      mvp: () => `5 minutes: Practice one fundamental technique.`
    }
  ],

  general: [
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `${minutes} minutes: ${desc}. Make meaningful progress.`,
      mvp: (desc) => `5 minutes: Make one step forward on ${desc.toLowerCase()}.`
    },
    {
      title: (name, desc) => name,
      instructions: (name, minutes, desc) => `Focus on ${desc.toLowerCase()} for ${minutes} minutes. Single-task mode.`,
      mvp: () => `5 minutes: Complete one small task.`
    }
  ]
}

// Challenge templates for high performers
const CHALLENGE_TEMPLATES = {
  study: {
    title: (name) => `${name} - Challenge`,
    instructions: (name, minutes, desc) => desc
      ? `Extended ${minutes}-minute deep session: ${desc}. Push your focus to the next level.`
      : `Extended ${minutes}-minute deep study session. Maximum focus, no breaks.`,
    multiplier: 1.5
  },
  fitness: {
    title: (name) => `${name} - Challenge`,
    instructions: (name, minutes, desc) => desc
      ? `Challenge session (${minutes} min): ${desc}. Increase intensity.`
      : `Challenge ${minutes}-minute session. Push a little harder today.`,
    multiplier: 1.25
  },
  language: {
    title: (name) => `${name} - Immersion`,
    instructions: (name, minutes, desc) => `${minutes}-minute immersion. No native language allowed.`,
    multiplier: 1.5
  },
  creative: {
    title: (name) => `${name} - Ship It`,
    instructions: (name, minutes, desc) => desc
      ? `Complete and share: ${desc}. ${minutes} minutes to finish something.`
      : `Create and ship something in ${minutes} minutes. Share it with someone.`,
    multiplier: 1.5
  },
  skill: {
    title: (name) => `${name} - Level Up`,
    instructions: (name, minutes, desc) => desc
      ? `Advanced session (${minutes} min): ${desc}. Focus on what's hardest.`
      : `${minutes}-minute advanced session. Work on your weakest areas.`,
    multiplier: 1.5
  },
  general: {
    title: (name) => `${name} - Sprint`,
    instructions: (name, minutes, desc) => desc
      ? `${minutes}-minute sprint: ${desc}. Maximum output.`
      : `${minutes}-minute productivity sprint. Maximum focus and output.`,
    multiplier: 1.5
  }
}

// Calculate XP reward based on difficulty and minutes
const calculateXP = (difficulty, minutes, isChallenge = false) => {
  const baseXP = 25
  const difficultyMultiplier = 0.8 + (difficulty * 0.2) // 1.0 to 1.8
  const timeMultiplier = Math.min(minutes / 15, 3) // Cap at 3x for 45+ min
  const challengeBonus = isChallenge ? 1.5 : 1

  return Math.round(baseXP * difficultyMultiplier * timeMultiplier * challengeBonus)
}

// Get completion rate for last 7 days
const getRecentCompletionRate = (quests, trackId) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentQuests = quests.filter(q =>
    q.track_id === trackId &&
    new Date(q.date) >= sevenDaysAgo
  )

  if (recentQuests.length === 0) return 0.5 // Default to 50%

  const completed = recentQuests.filter(q =>
    q.status === 'completed' || q.status === 'mvp_completed'
  ).length

  return completed / recentQuests.length
}

// Calculate streak for a track
const getCurrentStreak = (quests, trackId) => {
  const trackQuests = quests
    .filter(q => q.track_id === trackId && (q.status === 'completed' || q.status === 'mvp_completed'))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (trackQuests.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const quest of trackQuests) {
    const questDate = new Date(quest.date)
    questDate.setHours(0, 0, 0, 0)

    const dayDiff = Math.floor((currentDate - questDate) / (1000 * 60 * 60 * 24))

    if (dayDiff <= 1) {
      streak++
      currentDate = questDate
    } else {
      break
    }
  }

  return streak
}

// Adjust difficulty based on completion rate
const adjustDifficulty = (baseDifficulty, completionRate) => {
  if (completionRate < 0.4) {
    return Math.max(1, baseDifficulty - 1)
  } else if (completionRate > 0.8) {
    return Math.min(5, baseDifficulty + 1)
  }
  return baseDifficulty
}

// Adjust time based on completion rate
const adjustTime = (baseTime, completionRate) => {
  if (completionRate < 0.4) {
    return Math.max(10, Math.round(baseTime * 0.75))
  } else if (completionRate > 0.8) {
    return Math.round(baseTime * 1.15)
  }
  return baseTime
}

// Generate a quest for a track
export const generateQuest = (track, existingQuests = [], userStyle = 'balanced', date = new Date()) => {
  const completionRate = getRecentCompletionRate(existingQuests, track.id)
  const streak = getCurrentStreak(existingQuests, track.id)

  // Determine if this should be a challenge day
  const shouldChallenge =
    userStyle !== 'chill' &&
    streak >= 7 &&
    completionRate > 0.8 &&
    Math.random() < 0.3 // 30% chance on qualifying days

  // Adjust difficulty and time
  const adjustedDifficulty = adjustDifficulty(track.difficulty_pref, completionRate)
  const adjustedTime = adjustTime(track.time_budget_min, completionRate)

  // Check if user provided a meaningful description
  const hasDescription = track.description && track.description.trim().length > 5

  // Select template (use seeded random based on date for consistency)
  const dateStr = date.toISOString().split('T')[0]
  const seed = hashCode(track.id + dateStr)

  let quest

  if (shouldChallenge) {
    // Challenge day quest
    const challengeTemplate = CHALLENGE_TEMPLATES[track.intent] || CHALLENGE_TEMPLATES.general
    const challengeTime = Math.round(adjustedTime * challengeTemplate.multiplier)

    quest = {
      track_id: track.id,
      user_id: track.user_id,
      date: dateStr,
      title: challengeTemplate.title(track.name),
      instructions: challengeTemplate.instructions(track.name, challengeTime, track.description),
      estimated_minutes: challengeTime,
      difficulty: Math.min(5, adjustedDifficulty + 1),
      mvp_instructions: `Complete at least ${Math.round(challengeTime * 0.4)} minutes to save your streak.`,
      mvp_minutes: Math.round(challengeTime * 0.4),
      reward_xp: calculateXP(adjustedDifficulty + 1, challengeTime, true),
      status: 'pending'
    }
  } else if (hasDescription) {
    // Rich quest with description context
    const templates = RICH_TEMPLATES[track.intent] || RICH_TEMPLATES.general
    const templateIndex = Math.abs(seed) % templates.length
    const template = templates[templateIndex]

    quest = {
      track_id: track.id,
      user_id: track.user_id,
      date: dateStr,
      title: template.title(track.name, track.description),
      instructions: template.instructions(track.name, adjustedTime, track.description),
      estimated_minutes: adjustedTime,
      difficulty: adjustedDifficulty,
      mvp_instructions: template.mvp(track.description),
      mvp_minutes: 5,
      reward_xp: calculateXP(adjustedDifficulty, adjustedTime),
      status: 'pending'
    }
  } else {
    // Simple quest - just use the track name, no awkward suffixes
    const simpleInstructions = SIMPLE_INSTRUCTIONS[track.intent] || SIMPLE_INSTRUCTIONS.general
    const simpleMVP = SIMPLE_MVP[track.intent] || SIMPLE_MVP.general

    quest = {
      track_id: track.id,
      user_id: track.user_id,
      date: dateStr,
      title: track.name, // Just the track name, clean and simple
      instructions: simpleInstructions(adjustedTime),
      estimated_minutes: adjustedTime,
      difficulty: adjustedDifficulty,
      mvp_instructions: simpleMVP,
      mvp_minutes: 5,
      reward_xp: calculateXP(adjustedDifficulty, adjustedTime),
      status: 'pending'
    }
  }

  return quest
}

// Generate quests for all active tracks for a day
export const generateDailyQuests = (tracks, existingQuests, userStyle, date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0]
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]

  const quests = []

  for (const track of tracks) {
    // Skip paused tracks
    if (track.is_paused) continue

    // Check if this day is active for the track
    const activeDays = track.days_active || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    if (!activeDays.includes(dayOfWeek)) continue

    // Check if quest already exists for this track/date
    const existingQuest = existingQuests.find(q =>
      q.track_id === track.id && q.date === dateStr
    )
    if (existingQuest) continue

    // Generate quest
    const quest = generateQuest(track, existingQuests, userStyle, date)
    quests.push(quest)
  }

  return quests
}

// Simple hash function for seeded randomness
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

// Safety filter for track constraints
export const validateTrackConstraints = (intent, constraints) => {
  const unsafePatterns = [
    /weight.?loss/i,
    /calorie/i,
    /fasting/i,
    /diet/i,
    /punishment/i,
    /self.?harm/i,
    /purge/i,
    /starv/i,
    /restrict/i,
    /binge/i
  ]

  if (intent === 'fitness' && constraints) {
    for (const pattern of unsafePatterns) {
      if (pattern.test(constraints)) {
        return {
          valid: false,
          message: 'Please focus on wellness goals like strength, mobility, or consistency. Weight-loss or restrictive goals are not supported.'
        }
      }
    }
  }

  return { valid: true }
}

// Notify community about quest activity
export const createCommunityNotification = (communityId, userId, type, questTitle, details = {}) => {
  const messages = {
    'quest_created': `created a new task: "${questTitle}"`,
    'quest_started': `started working on "${questTitle}"`,
    'quest_completed': `completed "${questTitle}"${details.xp ? ` (+${details.xp} XP)` : ''}`,
    'streak': `reached a ${details.streak}-day streak!`,
    'rank_up': `ranked up to ${details.rank}!`
  }

  return {
    community_id: communityId,
    user_id: userId,
    content: messages[type] || `updated "${questTitle}"`,
    message_type: type,
    metadata: details
  }
}

// Export for testing
export const _internal = {
  RICH_TEMPLATES,
  CHALLENGE_TEMPLATES,
  calculateXP,
  getRecentCompletionRate,
  getCurrentStreak,
  adjustDifficulty,
  adjustTime
}
