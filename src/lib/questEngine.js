// Quest Engine - Deterministic template-based quest generation
// Works without AI for $0 operation

// Quest templates by intent type
const QUEST_TEMPLATES = {
  study: [
    {
      title: (name) => `${name} Focus Session`,
      instructions: (name, minutes, desc) => desc
        ? `Complete a ${minutes}-minute focused ${desc.toLowerCase()} session. Eliminate distractions and work with intention.`
        : `Complete a ${minutes}-minute focused study session on ${name}. Eliminate distractions and work with intention.`,
      mvp: (name, desc) => desc
        ? `5-minute quick review: Scan your notes or materials for ${desc.toLowerCase()}.`
        : `5-minute quick review: Scan your notes or materials for ${name}.`
    },
    {
      title: (name) => `${name} Active Recall`,
      instructions: (name, minutes, desc) => desc
        ? `Spend ${minutes} minutes testing yourself on ${desc.toLowerCase()}. Write questions and answer them without looking at notes.`
        : `Spend ${minutes} minutes testing yourself on ${name} concepts. Write questions and answer them without looking at notes.`,
      mvp: (name, desc) => desc
        ? `3-minute recall: Write down 3 key things you remember about ${desc.toLowerCase()}.`
        : `3-minute recall: Write down 3 key things you remember from your last ${name} session.`
    },
    {
      title: (name) => `${name} Deep Work`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of deep work on ${desc.toLowerCase()}. Phone away, notifications off, full focus.`
        : `${minutes} minutes of deep work on ${name}. Phone away, notifications off, full focus.`,
      mvp: (name, desc) => desc
        ? `5-minute mini-session: Review one concept from ${desc.toLowerCase()}.`
        : `5-minute mini-session: Review one key concept from ${name}.`
    },
    {
      title: (name) => `${name} Practice Problems`,
      instructions: (name, minutes, desc) => desc
        ? `Work through practice problems or exercises for ${desc.toLowerCase()} for ${minutes} minutes.`
        : `Work through practice problems or exercises related to ${name} for ${minutes} minutes.`,
      mvp: (name, desc) => desc
        ? `Solve one problem related to ${desc.toLowerCase()}.`
        : `Solve one problem or review one example for ${name}.`
    }
  ],

  fitness: [
    {
      title: (name) => `${name} Session`,
      instructions: (name, minutes, desc) => desc
        ? `Complete a ${minutes}-minute ${desc.toLowerCase()} session. Focus on form and consistency.`
        : `Complete a ${minutes}-minute ${name.toLowerCase()} session. Listen to your body and focus on form.`,
      mvp: (name, desc) => desc
        ? `5-minute mobility: Light stretching and movement for ${desc.toLowerCase()} prep.`
        : `5-minute mobility: Light stretching and movement to stay active.`
    },
    {
      title: (name) => `${name} Movement`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of ${desc.toLowerCase()}. Stay consistent and enjoy the movement.`
        : `${minutes} minutes of mindful movement for ${name}. Stay consistent and enjoy the process.`,
      mvp: (name, desc) => `5-minute walk or gentle stretching to keep the streak alive.`
    },
    {
      title: (name) => `${name} Strength`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes}-minute strength-focused session for ${desc.toLowerCase()}. Quality over quantity.`
        : `${minutes}-minute strength-focused session. Quality over quantity, focus on control.`,
      mvp: (name, desc) => `3-minute bodyweight basics: 10 squats, 10 push-ups (or modified), 30-second plank.`
    },
    {
      title: (name) => `${name} Active Recovery`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of active recovery for ${desc.toLowerCase()}. Gentle movement to aid recovery.`
        : `${minutes} minutes of active recovery. Gentle movement, stretching, or yoga.`,
      mvp: (name, desc) => `5-minute stretch routine: Focus on major muscle groups.`
    }
  ],

  language: [
    {
      title: (name) => `${name} Vocabulary`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of vocabulary practice for ${desc.toLowerCase()}. Learn new words and review old ones.`
        : `${minutes} minutes of ${name} vocabulary practice. Learn new words and review ones you've learned.`,
      mvp: (name, desc) => desc
        ? `3-minute review: Look at 5 words you've learned in ${desc.toLowerCase()}.`
        : `3-minute review: Look at 5 words you've learned recently in ${name}.`
    },
    {
      title: (name) => `${name} Speaking Practice`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes speaking out loud in ${name}. ${desc}.`
        : `${minutes} minutes speaking out loud in ${name}. Read text, describe your day, or practice conversations.`,
      mvp: (name, desc) => `3-minute speaking: Say 5 sentences out loud in ${name}.`
    },
    {
      title: (name) => `${name} Listening`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of ${name} listening practice: ${desc.toLowerCase()}.`
        : `${minutes} minutes of ${name} listening practice. Podcast, video, or music with lyrics.`,
      mvp: (name, desc) => `5-minute listen: One short video or audio clip in ${name}.`
    },
    {
      title: (name) => `${name} Reading`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes reading in ${name}: ${desc.toLowerCase()}.`
        : `${minutes} minutes reading in ${name}. Articles, stories, or textbook content.`,
      mvp: (name, desc) => `3-minute read: One paragraph or short text in ${name}.`
    }
  ],

  creative: [
    {
      title: (name) => `${name} Creation`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of creative work: ${desc.toLowerCase()}. Focus on creating, not perfecting.`
        : `${minutes} minutes of creative work on ${name}. Focus on creating, not perfecting.`,
      mvp: (name, desc) => desc
        ? `5-minute sketch: Quick rough draft or idea dump for ${desc.toLowerCase()}.`
        : `5-minute sketch: Quick rough draft or idea dump for ${name}.`
    },
    {
      title: (name) => `${name} Practice`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of deliberate practice: ${desc.toLowerCase()}.`
        : `${minutes} minutes of deliberate ${name.toLowerCase()} practice. Work on technique or try something new.`,
      mvp: (name, desc) => desc
        ? `3-minute warm-up: Quick exercise for ${desc.toLowerCase()}.`
        : `3-minute warm-up: Quick creative exercise for ${name}.`
    },
    {
      title: (name) => `${name} Exploration`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes exploring: ${desc.toLowerCase()}. Try new ideas without judgment.`
        : `${minutes} minutes exploring new ideas for ${name}. Experiment without judgment.`,
      mvp: (name, desc) => `5-minute brainstorm: Write or sketch 3 new ideas.`
    },
    {
      title: (name) => `${name} Project Work`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes on your project: ${desc.toLowerCase()}.`
        : `${minutes} minutes working on your ${name.toLowerCase()} project. Make progress, any progress.`,
      mvp: (name, desc) => `5 minutes: Complete one small part of your project.`
    }
  ],

  skill: [
    {
      title: (name) => `${name} Practice`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of deliberate practice: ${desc.toLowerCase()}.`
        : `${minutes} minutes of deliberate ${name.toLowerCase()} practice. Focus on one specific aspect.`,
      mvp: (name, desc) => desc
        ? `5-minute drill: Quick focused practice on ${desc.toLowerCase()}.`
        : `5-minute drill: Quick focused practice on one ${name} fundamental.`
    },
    {
      title: (name) => `${name} Skill Building`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes building ${name} skills: ${desc.toLowerCase()}.`
        : `${minutes} minutes building ${name} skills. Challenge yourself just beyond your comfort zone.`,
      mvp: (name, desc) => `3-minute review: Practice one basic move or concept.`
    },
    {
      title: (name) => `${name} Learning`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes learning: ${desc.toLowerCase()}.`
        : `${minutes} minutes learning something new about ${name}. Tutorial, article, or video.`,
      mvp: (name, desc) => `5-minute learn: Watch or read one short tutorial.`
    },
    {
      title: (name) => `${name} Challenge`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes tackling a challenge: ${desc.toLowerCase()}.`
        : `${minutes} minutes tackling a ${name} challenge. Push your limits.`,
      mvp: (name, desc) => `5 minutes: Attempt one challenging exercise.`
    }
  ],

  general: [
    {
      title: (name) => `${name} Session`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes on ${name}: ${desc.toLowerCase()}.`
        : `${minutes} minutes dedicated to ${name}. Make meaningful progress.`,
      mvp: (name, desc) => desc
        ? `5 minutes: Quick progress on ${desc.toLowerCase()}.`
        : `5 minutes: Make one small step forward on ${name}.`
    },
    {
      title: (name) => `${name} Focus Time`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes of focused time: ${desc.toLowerCase()}.`
        : `${minutes} minutes of focused time on ${name}. Single-task, no distractions.`,
      mvp: (name, desc) => `5-minute focus: Complete one small task.`
    },
    {
      title: (name) => `${name} Planning`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes planning and organizing: ${desc.toLowerCase()}.`
        : `${minutes} minutes planning and organizing for ${name}. Set clear next steps.`,
      mvp: (name, desc) => `3-minute plan: Write down your next 3 action items.`
    },
    {
      title: (name) => `${name} Progress`,
      instructions: (name, minutes, desc) => desc
        ? `${minutes} minutes making progress: ${desc.toLowerCase()}.`
        : `${minutes} minutes making progress on ${name}. Every step counts.`,
      mvp: (name, desc) => `5 minutes: Do one thing to move forward.`
    }
  ]
}

// Challenge day templates (harder quests for high performers)
const CHALLENGE_TEMPLATES = {
  study: {
    title: (name) => `${name} Challenge: Deep Dive`,
    instructions: (name, minutes, desc) => desc
      ? `Extended ${Math.round(minutes * 1.5)}-minute deep session: ${desc.toLowerCase()}. Push your focus to the next level.`
      : `Extended ${Math.round(minutes * 1.5)}-minute deep study session on ${name}. Push your focus to the next level.`,
    multiplier: 1.5
  },
  fitness: {
    title: (name) => `${name} Challenge: Level Up`,
    instructions: (name, minutes, desc) => desc
      ? `Challenge session (${Math.round(minutes * 1.25)} min): ${desc.toLowerCase()}. Increase intensity or duration.`
      : `Challenge ${name.toLowerCase()} session (${Math.round(minutes * 1.25)} min). Increase intensity or try something harder.`,
    multiplier: 1.25
  },
  language: {
    title: (name) => `${name} Challenge: Immersion`,
    instructions: (name, minutes, desc) => `${Math.round(minutes * 1.5)}-minute immersion: Only ${name}, no native language allowed.`,
    multiplier: 1.5
  },
  creative: {
    title: (name) => `${name} Challenge: Create & Ship`,
    instructions: (name, minutes, desc) => desc
      ? `Complete and share something: ${desc.toLowerCase()}. Time: ${Math.round(minutes * 1.5)} minutes.`
      : `Create something complete in ${Math.round(minutes * 1.5)} minutes and share it (with a friend, online, anywhere).`,
    multiplier: 1.5
  },
  skill: {
    title: (name) => `${name} Challenge: Master Class`,
    instructions: (name, minutes, desc) => desc
      ? `Advanced session (${Math.round(minutes * 1.5)} min): ${desc.toLowerCase()}. Focus on advanced techniques.`
      : `${Math.round(minutes * 1.5)}-minute advanced ${name.toLowerCase()} session. Focus on techniques you find difficult.`,
    multiplier: 1.5
  },
  general: {
    title: (name) => `${name} Challenge: Sprint`,
    instructions: (name, minutes, desc) => desc
      ? `Challenge sprint (${Math.round(minutes * 1.5)} min): ${desc.toLowerCase()}. Maximum focus and output.`
      : `${Math.round(minutes * 1.5)}-minute sprint on ${name}. Maximum focus and output.`,
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
  const templates = QUEST_TEMPLATES[track.intent] || QUEST_TEMPLATES.general
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

  // Select template (use seeded random based on date for consistency)
  const dateStr = date.toISOString().split('T')[0]
  const seed = hashCode(track.id + dateStr)
  const templateIndex = Math.abs(seed) % templates.length

  let quest
  if (shouldChallenge) {
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
  } else {
    const template = templates[templateIndex]

    quest = {
      track_id: track.id,
      user_id: track.user_id,
      date: dateStr,
      title: template.title(track.name),
      instructions: template.instructions(track.name, adjustedTime, track.description),
      estimated_minutes: adjustedTime,
      difficulty: adjustedDifficulty,
      mvp_instructions: template.mvp(track.name, track.description),
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

// Export for testing
export const _internal = {
  QUEST_TEMPLATES,
  CHALLENGE_TEMPLATES,
  calculateXP,
  getRecentCompletionRate,
  getCurrentStreak,
  adjustDifficulty,
  adjustTime
}
