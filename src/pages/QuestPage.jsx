import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, Zap, Shield, Play, Pause, Check, X,
  Timer, BookOpen, Dumbbell, Languages, Palette, Target, Star,
  Share2, Camera, FileText, ChevronDown, Sparkles
} from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { formatMinutes, getRandomCompletionMessage, getRandomMVPMessage, cn, DIFFICULTY_LABELS } from '../lib/utils'

const INTENT_ICONS = {
  study: BookOpen,
  fitness: Dumbbell,
  language: Languages,
  creative: Palette,
  skill: Target,
  general: Star
}

const INTENT_COLORS = {
  study: 'from-blue-500 to-blue-600',
  fitness: 'from-green-500 to-green-600',
  language: 'from-purple-500 to-purple-600',
  creative: 'from-pink-500 to-pink-600',
  skill: 'from-orange-500 to-orange-600',
  general: 'from-gray-500 to-gray-600'
}

export default function QuestPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, addXP, useShield, updateProfile } = useAuth()

  const [quest, setQuest] = useState(null)
  const [track, setTrack] = useState(null)
  const [loading, setLoading] = useState(true)

  // Quest state
  const [questState, setQuestState] = useState('idle') // idle, running, paused, completing
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)

  // Completion form
  const [showCompletionForm, setShowCompletionForm] = useState(false)
  const [completionType, setCompletionType] = useState('full') // full, mvp
  const [reflection, setReflection] = useState('')
  const [minutesSpent, setMinutesSpent] = useState(0)

  useEffect(() => {
    loadQuest()
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [id])

  const loadQuest = () => {
    const q = localStore.getOne(TABLES.QUESTS, id)
    if (q) {
      setQuest(q)
      const t = localStore.getOne(TABLES.TRACKS, q.track_id)
      setTrack(t)

      // Restore state if in progress
      if (q.status === 'in_progress' && q.started_at) {
        const startTime = new Date(q.started_at).getTime()
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setElapsedTime(elapsed)
        setQuestState('running')
        startTimer(elapsed)
      }
    }
    setLoading(false)
  }

  const startTimer = (initialSeconds = 0) => {
    let seconds = initialSeconds
    const interval = setInterval(() => {
      seconds++
      setElapsedTime(seconds)
    }, 1000)
    setTimerInterval(interval)
  }

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  const handleStartQuest = () => {
    // Update quest status
    const updated = localStore.update(TABLES.QUESTS, id, {
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    setQuest(updated)
    setQuestState('running')
    startTimer()
    toast.success('Quest started! Good luck!')
  }

  const handlePauseQuest = () => {
    stopTimer()
    setQuestState('paused')
  }

  const handleResumeQuest = () => {
    setQuestState('running')
    startTimer(elapsedTime)
  }

  const handleCancelQuest = () => {
    stopTimer()
    const updated = localStore.update(TABLES.QUESTS, id, {
      status: 'pending',
      started_at: null
    })
    setQuest(updated)
    setQuestState('idle')
    setElapsedTime(0)
    toast('Quest cancelled')
  }

  const handleShowCompletion = (type) => {
    stopTimer()
    setCompletionType(type)
    setMinutesSpent(Math.max(1, Math.ceil(elapsedTime / 60)))
    setShowCompletionForm(true)
  }

  const handleCompleteQuest = async () => {
    const isMVP = completionType === 'mvp'
    const xpReward = isMVP ? Math.round(quest.reward_xp * 0.5) : quest.reward_xp

    // If MVP, check and use shield
    if (isMVP) {
      if ((profile?.shields_available ?? 0) <= 0) {
        toast.error('No shields available!')
        return
      }
      await useShield()
    }

    // Update quest
    const updated = localStore.update(TABLES.QUESTS, id, {
      status: isMVP ? 'mvp_completed' : 'completed',
      completed_at: new Date().toISOString()
    })
    setQuest(updated)

    // Log completion
    localStore.insert(TABLES.QUEST_LOGS, {
      quest_id: id,
      user_id: user.id,
      minutes_spent: minutesSpent,
      reflection_text: reflection,
      proof_type: 'none',
      xp_earned: xpReward,
      used_shield: isMVP
    })

    // Award XP
    await addXP(xpReward)

    // Update streaks
    updateStreaks()

    // Celebration!
    if (!isMVP) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      toast.success(getRandomCompletionMessage())
    } else {
      toast.success(getRandomMVPMessage())
    }

    // Navigate back
    setTimeout(() => {
      navigate('/')
    }, 1500)
  }

  const updateStreaks = () => {
    const today = new Date().toISOString().split('T')[0]

    // Update track streak
    const trackStreaks = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && s.track_id === quest.track_id
    )

    if (trackStreaks.length > 0) {
      const streak = trackStreaks[0]
      const lastDate = streak.last_completed_date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak = 1
      if (lastDate === yesterdayStr || lastDate === today) {
        newStreak = (streak.current_streak || 0) + (lastDate === today ? 0 : 1)
      }

      localStore.update(TABLES.STREAKS, streak.id, {
        current_streak: newStreak,
        best_streak: Math.max(streak.best_streak || 0, newStreak),
        last_completed_date: today
      })
    } else {
      localStore.insert(TABLES.STREAKS, {
        user_id: user.id,
        track_id: quest.track_id,
        is_global: false,
        current_streak: 1,
        best_streak: 1,
        last_completed_date: today
      })
    }

    // Update global streak
    const globalStreaks = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && s.is_global
    )

    if (globalStreaks.length > 0) {
      const streak = globalStreaks[0]
      const lastDate = streak.last_completed_date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      let newStreak = 1
      if (lastDate === yesterdayStr || lastDate === today) {
        newStreak = (streak.current_streak || 0) + (lastDate === today ? 0 : 1)
      }

      localStore.update(TABLES.STREAKS, streak.id, {
        current_streak: newStreak,
        best_streak: Math.max(streak.best_streak || 0, newStreak),
        last_completed_date: today
      })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || !quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const IntentIcon = INTENT_ICONS[track?.intent] || Star
  const gradientColor = INTENT_COLORS[track?.intent] || INTENT_COLORS.general
  const isCompleted = quest.status === 'completed' || quest.status === 'mvp_completed'

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className={cn(
        "relative overflow-hidden",
        `bg-gradient-to-br ${gradientColor}`
      )}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-4 py-6 pt-safe-top">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <IntentIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-sm">{track?.name}</p>
              <h1 className="text-xl font-display font-bold text-white">
                {quest.title}
              </h1>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-1 text-white/80 text-sm">
              <Clock className="w-4 h-4" />
              {formatMinutes(quest.estimated_minutes)}
            </span>
            <span className="flex items-center gap-1 text-white text-sm font-medium">
              <Zap className="w-4 h-4" />
              +{quest.reward_xp} XP
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
              {DIFFICULTY_LABELS[quest.difficulty] || 'Moderate'}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {/* Instructions */}
        <div className="card mb-4">
          <h2 className="font-semibold text-white mb-2">Instructions</h2>
          <p className="text-dark-muted">{quest.instructions}</p>
        </div>

        {/* MVP Option */}
        {quest.mvp_instructions && (
          <div className="card mb-4 border-cyan-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">MVP Fallback</h2>
            </div>
            <p className="text-dark-muted text-sm">{quest.mvp_instructions}</p>
            <p className="text-xs text-cyan-400 mt-2">
              Complete this instead to save your streak (uses 1 shield)
            </p>
          </div>
        )}

        {/* Timer display when quest is active */}
        <AnimatePresence>
          {(questState === 'running' || questState === 'paused') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card mb-4 text-center"
            >
              <p className="text-dark-muted text-sm mb-2">Time Elapsed</p>
              <div className="text-5xl font-mono font-bold text-white mb-4">
                {formatTime(elapsedTime)}
              </div>

              <div className="flex items-center justify-center gap-3">
                {questState === 'running' ? (
                  <button
                    onClick={handlePauseQuest}
                    className="btn-secondary"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeQuest}
                    className="btn-primary"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                )}
                <button
                  onClick={handleCancelQuest}
                  className="btn-ghost text-danger-light"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {!isCompleted && !showCompletionForm && (
          <div className="space-y-3">
            {questState === 'idle' && (
              <button
                onClick={handleStartQuest}
                className="btn-primary w-full py-4 text-lg"
              >
                <Play className="w-6 h-6" />
                Start Quest
              </button>
            )}

            {(questState === 'running' || questState === 'paused') && (
              <>
                <button
                  onClick={() => handleShowCompletion('full')}
                  className="btn-success w-full py-4 text-lg"
                >
                  <Check className="w-6 h-6" />
                  Complete Quest
                </button>
                <button
                  onClick={() => handleShowCompletion('mvp')}
                  className="btn-secondary w-full py-3 text-cyan-400 border-cyan-500/30"
                  disabled={(profile?.shields_available ?? 0) <= 0}
                >
                  <Shield className="w-5 h-5" />
                  Complete MVP ({profile?.shields_available ?? 0} shields left)
                </button>
              </>
            )}
          </div>
        )}

        {/* Completion Form */}
        <AnimatePresence>
          {showCompletionForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">
                  {completionType === 'mvp' ? 'MVP Completion' : 'Quest Complete!'}
                </h2>
                <button
                  onClick={() => setShowCompletionForm(false)}
                  className="text-dark-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Time spent (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={minutesSpent}
                    onChange={(e) => setMinutesSpent(parseInt(e.target.value) || 0)}
                    min={1}
                  />
                </div>

                <div>
                  <label className="label">Quick reflection (optional)</label>
                  <textarea
                    className="input min-h-[80px]"
                    placeholder="How did it go? Any insights?"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>

                <div className="bg-dark-surface rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">XP Reward</span>
                    <span className="text-xl font-bold text-primary-400">
                      +{completionType === 'mvp' ? Math.round(quest.reward_xp * 0.5) : quest.reward_xp} XP
                    </span>
                  </div>
                  {completionType === 'mvp' && (
                    <p className="text-xs text-cyan-400 mt-2">
                      Using 1 shield • 50% XP
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCompleteQuest}
                  className={cn(
                    "w-full py-4 text-lg",
                    completionType === 'mvp' ? 'btn-secondary text-cyan-400' : 'btn-success'
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  {completionType === 'mvp' ? 'Save Streak with MVP' : 'Complete & Earn XP'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Already completed */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-8"
          >
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-success-light" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Quest Completed!</h2>
            <p className="text-dark-muted">
              {quest.status === 'mvp_completed' ? 'Streak saved with MVP' : "Great work on today's quest"}
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary mt-4"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}
