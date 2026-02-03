import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Dumbbell, Languages, Palette, Target, Star,
  Clock, Loader2, AlertCircle, Calendar, Repeat, CalendarDays
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

const SCHEDULE_OPTIONS = [
  { value: 'today', label: 'Just Today', icon: Calendar, desc: 'One-time task' },
  { value: 'daily', label: 'Every Day', icon: Repeat, desc: 'Repeats daily' },
  { value: 'weekdays', label: 'Weekdays', icon: CalendarDays, desc: 'Mon-Fri' },
  { value: 'weekends', label: 'Weekends', icon: CalendarDays, desc: 'Sat-Sun' },
  { value: 'custom', label: 'Custom', icon: CalendarDays, desc: 'Pick days' },
]

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
    schedule_type: 'daily',
    days_active: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    scheduled_time: '',
    is_one_time: false,
    constraints: ''
  })

  const handleIntentSelect = (intent) => {
    setFormData({ ...formData, intent })
    setStep(2)
  }

  const handleScheduleSelect = (scheduleType) => {
    let days = []
    let isOneTime = false

    switch (scheduleType) {
      case 'today':
        days = []
        isOneTime = true
        break
      case 'daily':
        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        break
      case 'weekdays':
        days = ['mon', 'tue', 'wed', 'thu', 'fri']
        break
      case 'weekends':
        days = ['sat', 'sun']
        break
      case 'custom':
        days = formData.days_active.length > 0 ? formData.days_active : ['mon', 'wed', 'fri']
        break
    }

    setFormData({
      ...formData,
      schedule_type: scheduleType,
      days_active: days,
      is_one_time: isOneTime
    })
  }

  const handleDayToggle = (day) => {
    const days = formData.days_active.includes(day)
      ? formData.days_active.filter(d => d !== day)
      : [...formData.days_active, day]
    setFormData({ ...formData, days_active: days, schedule_type: 'custom' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Please enter a track name')
      return
    }

    if (!formData.is_one_time && formData.days_active.length === 0) {
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
      const maxTracks = 10

      if (existingTracks.length >= maxTracks) {
        setError(`You've reached the maximum of ${maxTracks} tracks.`)
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
        days_active: formData.is_one_time ? [] : formData.days_active,
        scheduled_time: formData.scheduled_time || null,
        is_one_time: formData.is_one_time,
        one_time_date: formData.is_one_time ? new Date().toISOString().split('T')[0] : null,
        constraints: formData.constraints.trim(),
        is_paused: false
      })

      // Create streak for this track (only for recurring)
      if (!formData.is_one_time) {
        localStore.insert(TABLES.STREAKS, {
          user_id: user.id,
          track_id: newTrack.id,
          is_global: false,
          current_streak: 0,
          best_streak: 0
        })
      }

      toast.success(formData.is_one_time ? 'Task created for today!' : 'Track created!')
      navigate('/')
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
          onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
          className="flex items-center gap-2 text-dark-muted hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-display font-bold text-white">
          {step === 1 ? 'New Task' : step === 2 ? 'Details' : 'Schedule'}
        </h1>
        <p className="text-dark-muted mt-1">
          {step === 1 && 'What type of activity?'}
          {step === 2 && 'Name and describe your task'}
          {step === 3 && 'When do you want to do this?'}
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                s <= step ? "bg-primary-500" : "bg-dark-border"
              )}
            />
          ))}
        </div>
      </header>

      <main className="px-4">
        {/* Step 1: Select Intent */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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

          {/* Step 2: Name & Description */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
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
                        <span className="font-medium text-white">{intent?.label}</span>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Track name */}
              <div>
                <label className="label">What are you working on? *</label>
                <input
                  type="text"
                  className="input text-lg"
                  placeholder="e.g., Finish essay, Learn React, Leg day"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={100}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">More details (optional)</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Add details for better task suggestions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                />
                <p className="text-xs text-dark-muted mt-1">
                  Better descriptions = smarter quest suggestions
                </p>
              </div>

              {/* Time budget */}
              <div>
                <label className="label">How long? ({formData.time_budget_min} min)</label>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={formData.time_budget_min}
                  onChange={(e) => setFormData({ ...formData, time_budget_min: parseInt(e.target.value) })}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-muted mt-1">
                  <span>5 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <button
                onClick={() => formData.name.trim() ? setStep(3) : setError('Please enter a name')}
                className="btn-primary w-full py-4"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <motion.form
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Schedule type selection */}
              <div className="space-y-2">
                {SCHEDULE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleScheduleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                      formData.schedule_type === option.value
                        ? "border-primary-500 bg-primary-500/10"
                        : "border-dark-border bg-dark-surface hover:border-dark-muted"
                    )}
                  >
                    <option.icon className={cn(
                      "w-5 h-5",
                      formData.schedule_type === option.value ? "text-primary-400" : "text-dark-muted"
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-xs text-dark-muted">{option.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      formData.schedule_type === option.value
                        ? "border-primary-500 bg-primary-500"
                        : "border-dark-muted"
                    )}>
                      {formData.schedule_type === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom days selection */}
              {formData.schedule_type === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <label className="label">Select days</label>
                  <div className="flex justify-between gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={cn(
                          "flex-1 py-3 rounded-xl text-sm font-medium transition-all",
                          formData.days_active.includes(day.value)
                            ? "bg-primary-500 text-white"
                            : "bg-dark-surface text-dark-muted hover:text-white"
                        )}
                      >
                        {day.label[0]}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Optional: Scheduled time */}
              {!formData.is_one_time && (
                <div>
                  <label className="label">Preferred time (optional)</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                  <p className="text-xs text-dark-muted mt-1">
                    We'll remind you at this time
                  </p>
                </div>
              )}

              {/* Difficulty (simplified) */}
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
                      onClick={() => setFormData({ ...formData, difficulty_pref: level.value })}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                        formData.difficulty_pref === level.value
                          ? "bg-primary-500 text-white"
                          : "bg-dark-surface text-dark-muted hover:text-white"
                      )}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
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
                ) : formData.is_one_time ? (
                  'Create Task'
                ) : (
                  'Create Track'
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
