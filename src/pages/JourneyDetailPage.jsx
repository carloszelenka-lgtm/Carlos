import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Plus, Flame, Trophy, TrendingUp, BarChart3,
  Dumbbell, GraduationCap, Palette, Languages, Target,
  CheckCircle2, Circle, Clock, Calendar, Repeat, Trash2,
  Edit2, X, Play, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, formatMinutes, JOURNEY_TYPES, DAYS_OF_WEEK } from '../lib/utils'

const JOURNEY_ICONS = {
  fitness: Dumbbell,
  academic: GraduationCap,
  creative: Palette,
  language: Languages
}

const JOURNEY_COLORS = {
  fitness: 'from-green-500 to-emerald-600',
  academic: 'from-blue-500 to-indigo-600',
  creative: 'from-pink-500 to-rose-600',
  language: 'from-purple-500 to-violet-600'
}

const SCHEDULE_OPTIONS = [
  { value: 'today', label: 'Just Today', desc: 'One-time' },
  { value: 'daily', label: 'Every Day', desc: 'Daily' },
  { value: 'weekdays', label: 'Weekdays', desc: 'Mon-Fri' },
  { value: 'weekends', label: 'Weekends', desc: 'Sat-Sun' },
  { value: 'custom', label: 'Custom', desc: 'Pick days' }
]

export default function JourneyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [journey, setJourney] = useState(null)
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddQuest, setShowAddQuest] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Quest form state
  const [questForm, setQuestForm] = useState({
    name: '',
    description: '',
    time_budget_min: 30,
    schedule: 'daily',
    custom_days: []
  })

  useEffect(() => {
    loadJourney()
  }, [id])

  const loadJourney = () => {
    const j = localStore.getOne(TABLES.JOURNEYS, id)
    if (!j || j.user_id !== user.id) {
      navigate('/journeys')
      return
    }
    setJourney(j)

    const journeyQuests = localStore.query(TABLES.JOURNEY_QUESTS, q => q.journey_id === id)
    setQuests(journeyQuests)
    setLoading(false)
  }

  const getActiveDays = () => {
    switch (questForm.schedule) {
      case 'today':
        return []
      case 'daily':
        return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      case 'weekdays':
        return ['mon', 'tue', 'wed', 'thu', 'fri']
      case 'weekends':
        return ['sat', 'sun']
      case 'custom':
        return questForm.custom_days
      default:
        return []
    }
  }

  const handleAddQuest = () => {
    if (!questForm.name.trim()) {
      toast.error('Quest name is required')
      return
    }

    const activeDays = getActiveDays()
    if (questForm.schedule === 'custom' && activeDays.length === 0) {
      toast.error('Select at least one day')
      return
    }

    const quest = {
      journey_id: id,
      user_id: user.id,
      name: questForm.name.trim(),
      description: questForm.description.trim(),
      time_budget_min: questForm.time_budget_min,
      days_active: activeDays,
      is_one_time: questForm.schedule === 'today',
      current_streak: 0,
      total_completions: 0
    }

    localStore.insert(TABLES.JOURNEY_QUESTS, quest)
    loadJourney()
    setShowAddQuest(false)
    setQuestForm({
      name: '',
      description: '',
      time_budget_min: 30,
      schedule: 'daily',
      custom_days: []
    })
    toast.success('Quest added!')
  }

  const handleDeleteQuest = (questId) => {
    localStore.delete(TABLES.JOURNEY_QUESTS, questId)
    loadJourney()
    toast.success('Quest deleted')
  }

  const handleDeleteJourney = () => {
    // Delete all quests first
    quests.forEach(q => localStore.delete(TABLES.JOURNEY_QUESTS, q.id))
    localStore.delete(TABLES.JOURNEYS, id)
    toast.success('Journey deleted')
    navigate('/journeys')
  }

  const toggleCustomDay = (day) => {
    const days = questForm.custom_days.includes(day)
      ? questForm.custom_days.filter(d => d !== day)
      : [...questForm.custom_days, day]
    setQuestForm({ ...questForm, custom_days: days })
  }

  if (loading || !journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const Icon = JOURNEY_ICONS[journey.type] || Target
  const gradientColor = JOURNEY_COLORS[journey.type] || JOURNEY_COLORS.fitness

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className={cn("relative overflow-hidden bg-gradient-to-br", gradientColor)}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-4 py-6 pt-safe-top">
          <button
            onClick={() => navigate('/journeys')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-white">
                {journey.name}
              </h1>
              <p className="text-white/70 text-sm">{JOURNEY_TYPES[journey.type]?.label} Journey</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-300" />
                <span className="text-xl font-bold text-white">{journey.current_streak || 0}</span>
              </div>
              <p className="text-xs text-white/70">Streak</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-xl font-bold text-white">{journey.best_streak || 0}</span>
              </div>
              <p className="text-xs text-white/70">Best</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-300" />
                <span className="text-xl font-bold text-white">{journey.total_xp || 0}</span>
              </div>
              <p className="text-xs text-white/70">XP</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {/* Quests Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Quests</h2>
          <button
            onClick={() => setShowAddQuest(true)}
            className="btn-primary py-1.5 px-3 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Quest
          </button>
        </div>

        {quests.length === 0 ? (
          <div className="card text-center py-8">
            <Target className="w-12 h-12 text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">No quests yet. Add your first quest!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map(quest => (
              <div key={quest.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{quest.name}</h3>
                    {quest.description && (
                      <p className="text-sm text-dark-muted mt-1">{quest.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-dark-muted flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatMinutes(quest.time_budget_min)}
                      </span>
                      {quest.is_one_time ? (
                        <span className="text-primary-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          One-time
                        </span>
                      ) : (
                        <span className="text-success-light flex items-center gap-1">
                          <Repeat className="w-4 h-4" />
                          {quest.days_active?.length === 7 ? 'Daily' :
                            quest.days_active?.length === 5 ? 'Weekdays' :
                              quest.days_active?.length === 2 ? 'Weekends' : 'Custom'}
                        </span>
                      )}
                      {quest.current_streak > 0 && (
                        <span className="text-orange-400 flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          {quest.current_streak}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="p-2 text-dark-muted hover:text-danger-light transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Journey Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-ghost w-full text-danger-light hover:bg-danger/10 mt-6"
        >
          <Trash2 className="w-5 h-5" />
          Delete Journey
        </button>
      </main>

      {/* Add Quest Modal */}
      {showAddQuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Quest</h3>
              <button
                onClick={() => setShowAddQuest(false)}
                className="p-1 hover:bg-dark-border rounded-lg"
              >
                <X className="w-5 h-5 text-dark-muted" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quest Name */}
              <div>
                <label className="label">Quest Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Push Day, Study Session"
                  value={questForm.name}
                  onChange={(e) => setQuestForm({ ...questForm, name: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input min-h-[60px]"
                  placeholder="What does this quest involve?"
                  value={questForm.description}
                  onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                  maxLength={200}
                />
              </div>

              {/* Time Budget */}
              <div>
                <label className="label">Duration ({questForm.time_budget_min} min)</label>
                <input
                  type="range"
                  min={5}
                  max={180}
                  step={5}
                  value={questForm.time_budget_min}
                  onChange={(e) => setQuestForm({ ...questForm, time_budget_min: parseInt(e.target.value) })}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-muted">
                  <span>5 min</span>
                  <span>3 hours</span>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="label">Repeat</label>
                <div className="grid grid-cols-3 gap-2">
                  {SCHEDULE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuestForm({ ...questForm, schedule: opt.value })}
                      className={cn(
                        "p-2 rounded-xl text-center transition-all",
                        questForm.schedule === opt.value
                          ? "bg-primary-500/20 border border-primary-500"
                          : "bg-dark-surface border border-dark-border hover:border-dark-muted"
                      )}
                    >
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-dark-muted">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Days */}
              {questForm.schedule === 'custom' && (
                <div>
                  <label className="label">Select Days</label>
                  <div className="flex justify-between gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleCustomDay(day.value)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                          questForm.custom_days.includes(day.value)
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
                onClick={() => setShowAddQuest(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuest}
                className="btn-primary flex-1"
              >
                Add Quest
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-sm w-full"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Delete Journey?</h3>
            <p className="text-dark-muted mb-4">
              This will permanently delete "{journey.name}" and all its quests. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJourney}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
