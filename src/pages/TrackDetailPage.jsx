import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Flame, Trophy, Clock, Edit2, Trash2, Pause, Play,
  BookOpen, Dumbbell, Languages, Palette, Target, Star,
  CheckCircle2, XCircle, Shield, Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, formatMinutes, formatDate, DAYS_OF_WEEK, DIFFICULTY_LABELS } from '../lib/utils'

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

export default function TrackDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [track, setTrack] = useState(null)
  const [streak, setStreak] = useState(null)
  const [recentQuests, setRecentQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadTrack()
  }, [id])

  const loadTrack = () => {
    const t = localStore.getOne(TABLES.TRACKS, id)
    if (!t || t.user_id !== user.id) {
      navigate('/tracks')
      return
    }
    setTrack(t)

    // Load streak
    const streaks = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && s.track_id === id
    )
    if (streaks.length > 0) {
      setStreak(streaks[0])
    }

    // Load recent quests (last 14 days)
    const quests = localStore.query(TABLES.QUESTS, q =>
      q.track_id === id
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 14)
    setRecentQuests(quests)

    setLoading(false)
  }

  const handleTogglePause = () => {
    localStore.update(TABLES.TRACKS, id, { is_paused: !track.is_paused })
    loadTrack()
    toast.success(track.is_paused ? 'Track resumed' : 'Track paused')
  }

  const handleDelete = () => {
    // Delete all related data
    const quests = localStore.query(TABLES.QUESTS, q => q.track_id === id)
    quests.forEach(q => {
      localStore.delete(TABLES.QUEST_LOGS, q.id)
      localStore.delete(TABLES.QUESTS, q.id)
    })

    const streaks = localStore.query(TABLES.STREAKS, s => s.track_id === id)
    streaks.forEach(s => localStore.delete(TABLES.STREAKS, s.id))

    localStore.delete(TABLES.TRACKS, id)

    toast.success('Track deleted')
    navigate('/tracks')
  }

  const getCompletionStats = () => {
    const completed = recentQuests.filter(q =>
      q.status === 'completed' || q.status === 'mvp_completed'
    ).length
    const total = recentQuests.length
    return { completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  if (loading || !track) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const IntentIcon = INTENT_ICONS[track.intent] || Star
  const gradientColor = INTENT_COLORS[track.intent] || INTENT_COLORS.general
  const stats = getCompletionStats()

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradientColor
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

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <IntentIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">
                  {track.name}
                </h1>
                <p className="text-white/70 text-sm capitalize">{track.intent}</p>
                {track.is_paused && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs text-white">
                    <Pause className="w-3 h-3" />
                    Paused
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-xl font-bold text-white">
                  {streak?.current_streak || 0}
                </span>
              </div>
              <p className="text-xs text-white/70">Current</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xl font-bold text-white">
                  {streak?.best_streak || 0}
                </span>
              </div>
              <p className="text-xs text-white/70">Best</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <span className="text-xl font-bold text-white">{stats.rate}%</span>
              <p className="text-xs text-white/70">Complete</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Track description */}
        {track.description && (
          <div className="card mb-4">
            <h2 className="font-semibold text-white mb-2">Description</h2>
            <p className="text-dark-muted">{track.description}</p>
          </div>
        )}

        {/* Track details */}
        <div className="card mb-4">
          <h2 className="font-semibold text-white mb-3">Details</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-muted flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Daily Budget
              </span>
              <span className="text-white">{formatMinutes(track.time_budget_min)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Difficulty</span>
              <span className="text-white">{DIFFICULTY_LABELS[track.difficulty_pref]}</span>
            </div>
            <div>
              <span className="text-dark-muted block mb-2">Active Days</span>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <span
                    key={day.value}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
                      (track.days_active || []).includes(day.value)
                        ? "bg-primary-500/20 text-primary-400"
                        : "bg-dark-border/50 text-dark-muted/50"
                    )}
                  >
                    {day.label[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent history */}
        <div className="card mb-4">
          <h2 className="font-semibold text-white mb-3">Recent History</h2>
          {recentQuests.length === 0 ? (
            <p className="text-dark-muted text-sm">No quests yet. They'll appear here once generated.</p>
          ) : (
            <div className="space-y-2">
              {recentQuests.slice(0, 7).map(quest => (
                <div
                  key={quest.id}
                  className="flex items-center justify-between py-2 border-b border-dark-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {quest.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-success-light" />
                    ) : quest.status === 'mvp_completed' ? (
                      <Shield className="w-5 h-5 text-cyan-400" />
                    ) : quest.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-danger-light" />
                    ) : (
                      <Calendar className="w-5 h-5 text-dark-muted" />
                    )}
                    <div>
                      <p className="text-sm text-white">{quest.title}</p>
                      <p className="text-xs text-dark-muted">{formatDate(quest.date)}</p>
                    </div>
                  </div>
                  {(quest.status === 'completed' || quest.status === 'mvp_completed') && (
                    <span className="text-sm text-success-light">+{quest.reward_xp} XP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleTogglePause}
            className="btn-secondary w-full"
          >
            {track.is_paused ? (
              <>
                <Play className="w-5 h-5" />
                Resume Track
              </>
            ) : (
              <>
                <Pause className="w-5 h-5" />
                Pause Track
              </>
            )}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-ghost w-full text-danger-light hover:bg-danger/10"
          >
            <Trash2 className="w-5 h-5" />
            Delete Track
          </button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Delete Track?</h3>
              <p className="text-dark-muted mb-4">
                This will permanently delete "{track.name}" and all its quests. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger flex-1"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
