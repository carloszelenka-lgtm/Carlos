import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Flame, Trophy, Clock, Edit2, Trash2, Pause, Play,
  BookOpen, Dumbbell, Languages, Palette, Target, Star,
  CheckCircle2, XCircle, Shield, Calendar, X, Loader2
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    time_budget_min: 30,
    difficulty_pref: 3,
    days_active: []
  })

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
    setEditForm({
      name: t.name || '',
      description: t.description || '',
      time_budget_min: t.time_budget_min || 30,
      difficulty_pref: t.difficulty_pref || 3,
      days_active: t.days_active || []
    })

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

  const handleEditDayToggle = (day) => {
    const days = editForm.days_active.includes(day)
      ? editForm.days_active.filter(d => d !== day)
      : [...editForm.days_active, day]
    setEditForm({ ...editForm, days_active: days })
  }

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Track name is required')
      return
    }
    if (editForm.days_active.length === 0 && !track.is_one_time) {
      toast.error('Select at least one active day')
      return
    }

    setSaving(true)
    try {
      localStore.update(TABLES.TRACKS, id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        time_budget_min: editForm.time_budget_min,
        difficulty_pref: editForm.difficulty_pref,
        days_active: editForm.days_active
      })
      loadTrack()
      setShowEditModal(false)
      toast.success('Track updated!')
    } catch (error) {
      toast.error('Failed to update track')
    }
    setSaving(false)
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
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <Edit2 className="w-5 h-5 text-white" />
            </button>
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

        {/* Edit modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Edit Track</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-dark-border rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark-muted" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="label">Track Name *</label>
                  <input
                    type="text"
                    className="input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    maxLength={500}
                  />
                </div>

                {/* Time budget */}
                <div>
                  <label className="label">Daily Time ({editForm.time_budget_min} min)</label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={editForm.time_budget_min}
                    onChange={(e) => setEditForm({ ...editForm, time_budget_min: parseInt(e.target.value) })}
                    className="w-full accent-primary-500"
                  />
                  <div className="flex justify-between text-xs text-dark-muted mt-1">
                    <span>5 min</span>
                    <span>2 hours</span>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="label">Difficulty</label>
                  <div className="flex gap-2">
                    {[
                      { value: 1, label: 'Easy' },
                      { value: 3, label: 'Medium' },
                      { value: 5, label: 'Hard' }
                    ].map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, difficulty_pref: level.value })}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                          editForm.difficulty_pref === level.value
                            ? "bg-primary-500 text-white"
                            : "bg-dark-surface text-dark-muted hover:text-white"
                        )}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active days (only for recurring tracks) */}
                {!track.is_one_time && (
                  <div>
                    <label className="label">Active Days</label>
                    <div className="flex justify-between gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleEditDayToggle(day.value)}
                          className={cn(
                            "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                            editForm.days_active.includes(day.value)
                              ? "bg-primary-500 text-white"
                              : "bg-dark-surface text-dark-muted hover:text-white"
                          )}
                        >
                          {day.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
