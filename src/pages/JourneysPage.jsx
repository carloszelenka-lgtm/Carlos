import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Crown, Dumbbell, GraduationCap, Palette, Languages,
  ChevronRight, Lock, Flame, Target, TrendingUp, BarChart3
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, JOURNEY_TYPES } from '../lib/utils'

const JOURNEY_ICONS = {
  fitness: Dumbbell,
  academic: GraduationCap,
  creative: Palette,
  language: Languages
}

const JOURNEY_COLORS = {
  fitness: { bg: 'bg-green-500/20', text: 'text-green-400', gradient: 'from-green-500 to-emerald-600' },
  academic: { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500 to-indigo-600' },
  creative: { bg: 'bg-pink-500/20', text: 'text-pink-400', gradient: 'from-pink-500 to-rose-600' },
  language: { bg: 'bg-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500 to-violet-600' }
}

export default function JourneysPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedType, setSelectedType] = useState(null)
  const [journeyName, setJourneyName] = useState('')

  const isPro = profile?.is_pro

  useEffect(() => {
    if (user) loadJourneys()
  }, [user])

  const loadJourneys = () => {
    const userJourneys = localStore.query(TABLES.JOURNEYS, j => j.user_id === user.id)
    setJourneys(userJourneys)
    setLoading(false)
  }

  const handleCreateJourney = () => {
    if (!selectedType || !journeyName.trim()) return

    const journey = {
      user_id: user.id,
      type: selectedType,
      name: journeyName.trim(),
      quests: [],
      total_xp: 0,
      current_streak: 0,
      best_streak: 0
    }

    localStore.insert(TABLES.JOURNEYS, journey)
    loadJourneys()
    setShowCreateModal(false)
    setSelectedType(null)
    setJourneyName('')
  }

  if (!isPro) {
    return (
      <div className="min-h-screen pb-4">
        <header className="px-4 py-6 pt-safe-top">
          <h1 className="text-2xl font-display font-bold text-white">Journeys</h1>
          <p className="text-dark-muted text-sm">Deep tracking for your goals</p>
        </header>

        <main className="px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12 bg-gradient-to-br from-primary-900/50 to-purple-900/50 border-primary-500/30"
          >
            <div className="w-20 h-20 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Pro Feature
            </h3>
            <p className="text-dark-muted mb-6 max-w-sm mx-auto">
              Journeys let you create focused paths for fitness, academics, creativity, or language learning with specialized tracking and insights.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
              {Object.entries(JOURNEY_TYPES).map(([key, type]) => {
                const Icon = JOURNEY_ICONS[key]
                const colors = JOURNEY_COLORS[key]
                return (
                  <div key={key} className={cn("p-3 rounded-xl", colors.bg)}>
                    <Icon className={cn("w-6 h-6 mx-auto mb-1", colors.text)} />
                    <p className="text-sm text-white font-medium">{type.label}</p>
                  </div>
                )
              })}
            </div>

            <Link to="/settings" className="btn-primary inline-flex">
              <Crown className="w-5 h-5" />
              Upgrade to Pro
            </Link>
          </motion.div>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4">
      <header className="px-4 py-6 pt-safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Journeys</h1>
            <p className="text-dark-muted text-sm">Your focused paths</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary py-2 px-4"
          >
            <Plus className="w-5 h-5" />
            New
          </button>
        </div>
      </header>

      <main className="px-4">
        {journeys.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Start Your First Journey
            </h3>
            <p className="text-dark-muted mb-4">
              Create a journey to track your progress in fitness, academics, creativity, or language learning.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex"
            >
              <Plus className="w-5 h-5" />
              Create Journey
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {journeys.map((journey, index) => {
                const Icon = JOURNEY_ICONS[journey.type] || Target
                const colors = JOURNEY_COLORS[journey.type] || JOURNEY_COLORS.fitness
                const questCount = localStore.query(TABLES.JOURNEY_QUESTS, q => q.journey_id === journey.id).length

                return (
                  <motion.div
                    key={journey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/journeys/${journey.id}`}
                      className="card-hover block"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                          colors.gradient
                        )}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {journey.name}
                            </h3>
                            <span className={cn("badge", colors.bg, colors.text)}>
                              {JOURNEY_TYPES[journey.type]?.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-dark-muted">
                              {questCount} quest{questCount !== 1 ? 's' : ''}
                            </span>
                            {journey.current_streak > 0 && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <Flame className="w-4 h-4" />
                                {journey.current_streak}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-primary-400">
                              <TrendingUp className="w-4 h-4" />
                              {journey.total_xp || 0} XP
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-dark-muted shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Create Journey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Create Journey</h3>

            {/* Journey Type Selection */}
            <div className="mb-4">
              <label className="label">Journey Type</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(JOURNEY_TYPES).map(([key, type]) => {
                  const Icon = JOURNEY_ICONS[key]
                  const colors = JOURNEY_COLORS[key]
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedType(key)}
                      className={cn(
                        "p-4 rounded-xl text-left transition-all",
                        selectedType === key
                          ? `${colors.bg} border-2 border-current ${colors.text}`
                          : "bg-dark-surface border border-dark-border hover:border-dark-muted"
                      )}
                    >
                      <Icon className={cn("w-6 h-6 mb-2", selectedType === key ? colors.text : "text-dark-muted")} />
                      <p className="font-medium text-white">{type.label}</p>
                      <p className="text-xs text-dark-muted mt-1">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Journey Name */}
            {selectedType && (
              <div className="mb-4">
                <label className="label">Journey Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder={`My ${JOURNEY_TYPES[selectedType]?.label} Journey`}
                  value={journeyName}
                  onChange={(e) => setJourneyName(e.target.value)}
                  maxLength={50}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedType(null)
                  setJourneyName('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateJourney}
                disabled={!selectedType || !journeyName.trim()}
                className="btn-primary flex-1"
              >
                Create Journey
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
