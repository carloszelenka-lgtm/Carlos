import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Target, BookOpen, Dumbbell, Languages, Palette, Star,
  ChevronRight, Flame, Pause, Play, MoreVertical, Calendar, Repeat
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, formatMinutes, DAYS_OF_WEEK } from '../lib/utils'

const INTENT_ICONS = {
  study: BookOpen,
  fitness: Dumbbell,
  language: Languages,
  creative: Palette,
  skill: Target,
  general: Star
}

const INTENT_COLORS = {
  study: { bg: 'bg-blue-500/20', text: 'text-blue-400', gradient: 'from-blue-500 to-blue-600' },
  fitness: { bg: 'bg-green-500/20', text: 'text-green-400', gradient: 'from-green-500 to-green-600' },
  language: { bg: 'bg-purple-500/20', text: 'text-purple-400', gradient: 'from-purple-500 to-purple-600' },
  creative: { bg: 'bg-pink-500/20', text: 'text-pink-400', gradient: 'from-pink-500 to-pink-600' },
  skill: { bg: 'bg-orange-500/20', text: 'text-orange-400', gradient: 'from-orange-500 to-orange-600' },
  general: { bg: 'bg-gray-500/20', text: 'text-gray-400', gradient: 'from-gray-500 to-gray-600' }
}

export default function TracksPage() {
  const { user, profile } = useAuth()
  const [tracks, setTracks] = useState([])
  const [streaks, setStreaks] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadTracks()
  }, [user])

  const loadTracks = () => {
    const userTracks = localStore.query(TABLES.TRACKS, t => t.user_id === user.id)

    // Sort tracks: active first, then by name
    const sortedTracks = userTracks.sort((a, b) => {
      // Paused tracks go to the bottom
      if (a.is_paused !== b.is_paused) return a.is_paused ? 1 : -1
      // Sort by created date (newer first)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    setTracks(sortedTracks)

    // Load streaks
    const trackStreaks = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && !s.is_global
    )
    const streakMap = {}
    trackStreaks.forEach(s => {
      streakMap[s.track_id] = s.current_streak || 0
    })
    setStreaks(streakMap)

    setLoading(false)
  }

  // Separate one-time tasks from recurring tracks
  const oneTimeTasks = tracks.filter(t => t.is_one_time)
  const recurringTracks = tracks.filter(t => !t.is_one_time)

  // Check if a track is active today (for recurring tracks)
  const isActiveToday = (track) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase()
    const dayMap = { sun: 'sun', mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat' }
    return (track.days_active || []).includes(dayMap[today])
  }

  // Sort recurring tracks: active today first
  const sortedRecurringTracks = recurringTracks.sort((a, b) => {
    const aActive = isActiveToday(a)
    const bActive = isActiveToday(b)
    if (aActive !== bActive) return aActive ? -1 : 1
    return 0
  })

  const togglePause = (trackId, isPaused) => {
    localStore.update(TABLES.TRACKS, trackId, { is_paused: !isPaused })
    loadTracks()
  }

  const maxTracks = profile?.is_pro ? 10 : 3
  const canCreateTrack = tracks.length < maxTracks

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Tracks</h1>
            <p className="text-dark-muted text-sm">
              {tracks.length} of {maxTracks} tracks
              {!profile?.is_pro && tracks.length >= 3 && (
                <span className="text-primary-400 ml-1">(Upgrade for more)</span>
              )}
            </p>
          </div>
          {canCreateTrack && (
            <Link to="/tracks/new" className="btn-primary py-2 px-4">
              <Plus className="w-5 h-5" />
              New
            </Link>
          )}
        </div>
      </header>

      {/* Tracks list */}
      <main className="px-4">
        {tracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No tracks yet
            </h3>
            <p className="text-dark-muted mb-4">
              Create your first track to start receiving daily quests.
            </p>
            <Link to="/tracks/new" className="btn-primary inline-flex">
              <Plus className="w-5 h-5" />
              Create Track
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* One-time tasks section */}
            {oneTimeTasks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-primary-400" />
                  <h2 className="font-semibold text-white">Today's Tasks</h2>
                  <span className="text-sm text-dark-muted">({oneTimeTasks.length})</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {oneTimeTasks.map((track, index) => {
                      const IntentIcon = INTENT_ICONS[track.intent] || Star
                      const colors = INTENT_COLORS[track.intent] || INTENT_COLORS.general

                      return (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link to={`/tracks/${track.id}`} className="card-hover block">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                                colors.gradient
                              )}>
                                <IntentIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate">{track.name}</h3>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className={cn("capitalize", colors.text)}>{track.intent}</span>
                                  <span className="text-dark-muted">{formatMinutes(track.time_budget_min)}</span>
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
              </section>
            )}

            {/* Recurring tracks section */}
            {sortedRecurringTracks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Repeat className="w-5 h-5 text-success-light" />
                  <h2 className="font-semibold text-white">Recurring Tracks</h2>
                  <span className="text-sm text-dark-muted">({sortedRecurringTracks.length})</span>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {sortedRecurringTracks.map((track, index) => {
                      const IntentIcon = INTENT_ICONS[track.intent] || Star
                      const colors = INTENT_COLORS[track.intent] || INTENT_COLORS.general
                      const streak = streaks[track.id] || 0
                      const activeToday = isActiveToday(track)

                      return (
                        <motion.div
                          key={track.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            to={`/tracks/${track.id}`}
                            className={cn(
                              "card-hover block",
                              track.is_paused && "opacity-60",
                              activeToday && !track.is_paused && "border-l-4 border-l-primary-500"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                                colors.gradient
                              )}>
                                <IntentIcon className="w-6 h-6 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-white truncate">
                                    {track.name}
                                  </h3>
                                  {track.is_paused && (
                                    <span className="badge bg-dark-border text-dark-muted">
                                      <Pause className="w-3 h-3" />
                                      Paused
                                    </span>
                                  )}
                                  {activeToday && !track.is_paused && (
                                    <span className="badge bg-primary-500/20 text-primary-400">
                                      Today
                                    </span>
                                  )}
                                </div>

                                {track.description && (
                                  <p className="text-sm text-dark-muted mt-0.5 line-clamp-1">
                                    {track.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className={cn("capitalize", colors.text)}>
                                    {track.intent}
                                  </span>
                                  <span className="text-dark-muted">
                                    {formatMinutes(track.time_budget_min)}/day
                                  </span>
                                  {streak > 0 && (
                                    <span className="flex items-center gap-1 text-orange-400">
                                      <Flame className="w-4 h-4" />
                                      {streak}
                                    </span>
                                  )}
                                </div>

                                {/* Active days */}
                                <div className="flex items-center gap-1 mt-2">
                                  {DAYS_OF_WEEK.map(day => (
                                    <span
                                      key={day.value}
                                      className={cn(
                                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium",
                                        (track.days_active || []).includes(day.value)
                                          ? `${colors.bg} ${colors.text}`
                                          : "bg-dark-border/50 text-dark-muted/50"
                                      )}
                                    >
                                      {day.label[0]}
                                    </span>
                                  ))}
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
              </section>
            )}
          </div>
        )}

        {/* Upgrade prompt */}
        {!profile?.is_pro && tracks.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card mt-6 bg-gradient-to-br from-primary-900/50 to-purple-900/50 border-primary-500/30"
          >
            <h3 className="font-semibold text-white mb-2">
              Need more tracks?
            </h3>
            <p className="text-dark-muted text-sm mb-3">
              Upgrade to Pro for unlimited tracks, AI personalization, and more.
            </p>
            <Link to="/settings" className="btn-primary py-2 text-sm">
              Upgrade to Pro
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}
