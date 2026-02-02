import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Trophy, Shield, Plus, ChevronRight, Zap, Clock,
  CheckCircle2, Circle, Sparkles, Settings, Skull
} from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { generateDailyQuests } from '../lib/questEngine'
import {
  formatDate, getRankInfo, getRankProgress, getNextRank,
  getStatusInfo, getIntentInfo, formatMinutes, cn
} from '../lib/utils'
import QuestCard from '../components/quests/QuestCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, profile, isLocalMode } = useAuth()
  const [quests, setQuests] = useState([])
  const [tracks, setTracks] = useState([])
  const [globalStreak, setGlobalStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Load tracks
      const userTracks = localStore.query(TABLES.TRACKS, t => t.user_id === user.id)
      setTracks(userTracks)

      // Load existing quests
      const today = new Date().toISOString().split('T')[0]
      let userQuests = localStore.query(TABLES.QUESTS, q => q.user_id === user.id)

      // Generate quests for today if needed
      if (userTracks.length > 0) {
        const newQuests = generateDailyQuests(userTracks, userQuests, profile?.style || 'balanced')
        if (newQuests.length > 0) {
          newQuests.forEach(quest => {
            const inserted = localStore.insert(TABLES.QUESTS, quest)
            userQuests.push(inserted)
          })
        }
      }

      // Filter to today's quests
      const todayQuests = userQuests.filter(q => q.date === today)
      setQuests(todayQuests)

      // Load global streak
      const streaks = localStore.query(TABLES.STREAKS, s => s.user_id === user.id && s.is_global)
      if (streaks.length > 0) {
        setGlobalStreak(streaks[0].current_streak)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const rankInfo = getRankInfo(profile?.rank || 'Novice')
  const rankProgress = getRankProgress(profile?.xp || 0, profile?.rank || 'Novice')
  const nextRank = getNextRank(profile?.rank || 'Novice')
  const nextRankInfo = nextRank ? getRankInfo(nextRank) : null

  const pendingQuests = quests.filter(q => q.status === 'pending' || q.status === 'in_progress')
  const completedQuests = quests.filter(q => q.status === 'completed' || q.status === 'mvp_completed')

  const completionRate = quests.length > 0
    ? Math.round((completedQuests.length / quests.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header with profile */}
      <header className="bg-gradient-to-br from-primary-900/80 via-dark-surface to-dark-bg pt-safe-top">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-dark-muted text-sm">{formatDate(new Date())}</p>
              <h1 className="text-2xl font-display font-bold text-white">
                Hey, {profile?.username || 'Player'}!
              </h1>
            </div>
            <Link to="/settings" className="btn-icon text-dark-muted hover:text-white">
              <Settings className="w-6 h-6" />
            </Link>
          </div>

          {/* Stats row */}
          <div className={cn(
            "grid gap-3",
            (profile?.strike_limit || 0) > 0 ? "grid-cols-4" : "grid-cols-3"
          )}>
            {/* Streak */}
            <div className="card bg-dark-card/80 backdrop-blur-sm p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className={cn(
                  "w-5 h-5",
                  globalStreak > 0 ? "text-orange-400" : "text-dark-muted"
                )} />
                <span className="text-2xl font-bold text-white">{globalStreak}</span>
              </div>
              <p className="text-xs text-dark-muted">Streak</p>
            </div>

            {/* XP / Rank */}
            <div className="card bg-dark-card/80 backdrop-blur-sm p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-lg">{rankInfo.icon}</span>
                <span className={cn(
                  "text-sm font-semibold",
                  `rank-${(profile?.rank || 'Novice').toLowerCase()}`
                )}>
                  {profile?.rank || 'Novice'}
                </span>
              </div>
              <p className="text-xs text-white font-medium">
                {(profile?.xp || 0).toLocaleString()} XP
              </p>
            </div>

            {/* Shields */}
            <div className="card bg-dark-card/80 backdrop-blur-sm p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">
                  {profile?.shields_available ?? 2}
                </span>
              </div>
              <p className="text-xs text-dark-muted">Shields</p>
            </div>

            {/* Strikes - only show if strike system is enabled */}
            {(profile?.strike_limit || 0) > 0 && (
              <div className="card bg-dark-card/80 backdrop-blur-sm p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Skull className={cn(
                    "w-5 h-5",
                    (profile?.strikes || 0) > 0 ? "text-danger-light" : "text-dark-muted"
                  )} />
                  <span className="text-2xl font-bold text-white">
                    {profile?.strikes || 0}/{profile?.strike_limit}
                  </span>
                </div>
                <p className="text-xs text-dark-muted">Strikes</p>
              </div>
            )}
          </div>

          {/* Rank progress bar */}
          {nextRank && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`rank-${(profile?.rank || 'Novice').toLowerCase()}`}>
                  {profile?.rank || 'Novice'}
                </span>
                <span className={`rank-${nextRank.toLowerCase()}`}>
                  {nextRank}
                </span>
              </div>
              <div className="progress-bar bg-dark-border">
                <motion.div
                  className="progress-fill bg-gradient-to-r from-primary-500 to-primary-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${rankProgress * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-dark-muted mt-1 text-center">
                {nextRankInfo ? `${(nextRankInfo.xpMin - (profile?.xp || 0)).toLocaleString()} XP to ${nextRank}` : ''}
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4">
        {/* Today's progress */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Today's Progress</h2>
            <span className="text-2xl font-bold text-primary-400">{completionRate}%</span>
          </div>
          <div className="progress-bar h-3">
            <motion.div
              className="progress-fill bg-gradient-to-r from-primary-500 to-success"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-dark-muted">
              {completedQuests.length} of {quests.length} quests
            </span>
            {completionRate === 100 && (
              <span className="text-success-light flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                All done!
              </span>
            )}
          </div>
        </div>

        {/* Active quests */}
        {pendingQuests.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary-400" />
                Active Quests
              </h2>
              <span className="text-sm text-dark-muted">{pendingQuests.length} remaining</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pendingQuests.map((quest, index) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <QuestCard
                      quest={quest}
                      track={tracks.find(t => t.id === quest.track_id)}
                      onUpdate={loadData}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Completed quests */}
        {completedQuests.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-light" />
                Completed
              </h2>
            </div>

            <div className="space-y-3">
              {completedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  track={tracks.find(t => t.id === quest.track_id)}
                  onUpdate={loadData}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* No tracks state */}
        {tracks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-8"
          >
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Start Your Journey
            </h3>
            <p className="text-dark-muted mb-4">
              Create your first track to begin receiving daily quests.
            </p>
            <Link to="/tracks/new" className="btn-primary inline-flex">
              <Plus className="w-5 h-5" />
              Create Track
            </Link>
          </motion.div>
        )}

        {/* No quests for today */}
        {tracks.length > 0 && quests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-8"
          >
            <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success-light" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Rest Day
            </h3>
            <p className="text-dark-muted">
              No quests scheduled for today. Check your track schedules.
            </p>
          </motion.div>
        )}

        {/* Quick actions */}
        <section className="mt-6">
          <div className="flex gap-3">
            <Link to="/tracks/new" className="btn-secondary flex-1">
              <Plus className="w-5 h-5" />
              New Track
            </Link>
            <Link to="/weekly" className="btn-secondary flex-1">
              <Trophy className="w-5 h-5" />
              Weekly
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
