import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Dumbbell, Languages, Palette, Target, Star,
  Clock, Loader2, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { validateTrackConstraints } from '../lib/questEngine'
import { cn, DAYS_OF_WEEK, DIFFICULTY_LABELS } from '../lib/utils'

const INTENTS = [
  { value: 'study', label: 'Study', icon: BookOpen, color: 'blue', desc: 'Academic learning, courses, reading' },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'green', desc: 'Exercise, mobility, wellness' },
  { value: 'language', label: 'Language', icon: Languages, color: 'purple', desc: 'Learning a new language' },
  { value: 'creative', label: 'Creative', icon: Palette, color: 'pink', desc: 'Art, writing, music, crafts' },
  { value: 'skill', label: 'Skill', icon: Target, color: 'orange', desc: 'Any skill to master' },
  { value: 'general', label: 'General', icon: Star, color: 'gray', desc: 'Anything else' },
]

const INTENT_COLORS = {
  study: 'border-blue-500 bg-blue-500/10',
  fitness: 'border-green-500 bg-green-500/10',
  language: 'border-purple-500 bg-purple-500/10',
  creative: 'border-pink-500 bg-pink-500/10',
  skill: 'border-orange-500 bg-orange-500/10',
  general: 'border-gray-500 bg-gray-500/10'
}

export default function CreateTrackPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    intent: '',
    difficulty_pref: 3,
    time_budget_min: 30,
    days_active: ['mon', 'tue', 'wed', 'thu', 'fri'],
    constraints: ''
  })

  const handleIntentSelect = (intent) => {
    setFormData({ ...formData, intent })
    setStep(2)
  }

  const handleDayToggle = (day) => {
    const days = formData.days_active.includes(day)
      ? formData.days_active.filter(d => d !== day)
      : [...formData.days_active, day]
    setFormData({ ...formData, days_active: days })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter a track name')
      return
    }

    if (formData.days_active.length === 0) {
      setError('Select at least one active day')
      return
    }

    // Validate constraints for safety
    const validation = validateTrackConstraints(formData.intent, formData.constraints)
    if (!validation.valid) {
      setError(validation.message)
      return
    }

    setLoading(true)

    try {
      // Check track limit
      const existingTracks = localStore.query(TABLES.TRACKS, t => t.user_id === user.id)
      const maxTracks = profile?.is_pro ? 10 : 3

      if (existingTracks.length >= maxTracks) {
        setError(`You've reached the maximum of ${maxTracks} tracks. ${!profile?.is_pro ? 'Upgrade to Pro for more.' : ''}`)
        setLoading(false)
        return
      }

      // Create track
      const newTrack = localStore.insert(TABLES.TRACKS, {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        intent: formData.intent,
        difficulty_pref: formData.difficulty_pref,
        time_budget_min: formData.time_budget_min,
        days_active: formData.days_active,
        constraints: formData.constraints.trim(),
        is_paused: false
      })

      // Create streak for this track
      localStore.insert(TABLES.STREAKS, {
        user_id: user.id,
        track_id: newTrack.id,
        is_global: false,
        current_streak: 0,
        best_streak: 0
      })

      toast.success('Track created! Your first quest will appear on the home page.')
      navigate('/tracks')
    } catch (err) {
      setError('Failed to create track. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className="flex items-center gap-2 text-dark-muted hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          {step === 1 ? 'Back' : 'Change Type'}
        </button>
        <h1 className="text-2xl font-display font-bold text-white">
          Create New Track
        </h1>
        <p className="text-dark-muted mt-1">
          {step === 1 ? 'What type of goal is this?' : 'Set up your track details'}
        </p>
      </header>

      <main className="px-4">
        {/* Step 1: Select Intent */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            {INTENTS.map((intent) => (
              <motion.button
                key={intent.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleIntentSelect(intent.value)}
                className={cn(
                  "card-hover p-4 text-left",
                  formData.intent === intent.value && INTENT_COLORS[intent.value]
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                  `bg-${intent.color}-500/20`
                )}>
                  <intent.icon className={`w-5 h-5 text-${intent.color}-400`} />
                </div>
                <h3 className="font-semibold text-white">{intent.label}</h3>
                <p className="text-xs text-dark-muted mt-1">{intent.desc}</p>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Track Details */}
        {step === 2 && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Selected intent badge */}
            <div className={cn("card p-3", INTENT_COLORS[formData.intent])}>
              <div className="flex items-center gap-3">
                {(() => {
                  const intent = INTENTS.find(i => i.value === formData.intent)
                  const Icon = intent?.icon || Star
                  return (
                    <>
                      <Icon className={`w-5 h-5 text-${intent?.color || 'gray'}-400`} />
                      <span className="font-medium text-white">{intent?.label} Track</span>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Track name */}
            <div>
              <label className="label">Track Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., FIN103 Study, French, Morning Yoga"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={100}
              />
              <p className="text-xs text-dark-muted mt-1">
                Give your track a clear, specific name
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Describe your activity in more detail. This helps generate better quests."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
              />
              <p className="text-xs text-dark-muted mt-1">
                E.g., "Reviewing chapters 1-5 for midterm" or "Learning vocabulary and grammar"
              </p>
            </div>

            {/* Time budget */}
            <div>
              <label className="label">Daily Time Budget</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={formData.time_budget_min}
                  onChange={(e) => setFormData({ ...formData, time_budget_min: parseInt(e.target.value) })}
                  className="flex-1 accent-primary-500"
                />
                <span className="w-20 text-center font-mono text-white bg-dark-surface px-3 py-2 rounded-lg">
                  {formData.time_budget_min} min
                </span>
              </div>
            </div>

            {/* Difficulty preference */}
            <div>
              <label className="label">Difficulty Preference</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty_pref: level })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      formData.difficulty_pref === level
                        ? "bg-primary-500 text-white"
                        : "bg-dark-surface text-dark-muted hover:text-white"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-dark-muted mt-2 text-center">
                {DIFFICULTY_LABELS[formData.difficulty_pref]}
              </p>
            </div>

            {/* Active days */}
            <div>
              <label className="label">Active Days</label>
              <div className="flex justify-between gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                      formData.days_active.includes(day.value)
                        ? "bg-primary-500 text-white"
                        : "bg-dark-surface text-dark-muted hover:text-white"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Constraints (optional) */}
            <div>
              <label className="label">Additional Notes (optional)</label>
              <textarea
                className="input min-h-[60px]"
                placeholder="Any specific constraints or preferences for your quests..."
                value={formData.constraints}
                onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
                maxLength={200}
              />
              {formData.intent === 'fitness' && (
                <p className="text-xs text-warning-light mt-1">
                  Note: Focus on wellness goals like strength, mobility, or consistency.
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-danger-light bg-danger/10 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Track'
              )}
            </button>
          </motion.form>
        )}
      </main>
    </div>
  )
}
