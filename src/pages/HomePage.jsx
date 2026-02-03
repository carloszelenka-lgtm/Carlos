import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flame, Trophy, Plus, Zap, Clock, Target,
  CheckCircle2, Sparkles, Settings, Skull, TrendingUp,
  Calendar, ChevronRight, Star
} from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { generateDailyQuests } from '../lib/questEngine'
import {
  formatDate, getRankInfo, getRankProgress, getNextRank,
  cn, getWeekKey
} from '../lib/utils'
import QuestCard from '../components/quests/QuestCard'

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  if (hour < 21) return "Good evening"
  return "Night owl mode"
}

// Get motivational message based on completion
const getMotivation = (completionRate, streak) => {
  if (completionRate === 100) return "Perfect day! You're on fire! 🔥"
  if (completionRate >= 75) return "Almost there! Keep pushing! 💪"
  if (completionRate >= 50) return "Halfway there! Don't stop now!"
  if (streak > 7) return `${streak} day streak! Legendary! 🏆`
  if (streak > 0) return "Keep the streak alive! 🎯"
  return "Let's make today count! ⚡"
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [quests, setQuests] = useState([])
  const [tracks, setTracks] = useState([])
  const [globalStreak, setGlobalStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [weeklyStrikesUsed, setWeeklyStrikesUsed] = useState(0)

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

      // Load weekly strikes
      const weekKey = getWeekKey()
      const weeklyStrikes = localStore.query(TABLES.WEEKLY_STRIKES, s =>
        s.user_id === user.id && s.week_key === weekKey
      )[0]
      setWeeklyStrikesUsed(weeklyStrikes?.strikes_used || 0)

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
  const strikeLimit = profile?.strike_limit ?? 3
  const strikesRemaining = strikeLimit === 999 ? '∞' : Math.max(0, strikeLimit - weeklyStrikesUsed)

  const pendingQuests = quests.filter(q => q.status === 'pending' || q.status === 'in_progress')
  const completedQuests = quests.filter(q => q.status === 'completed' || q.status === 'strike_used')

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
      {/* Gradient header */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/30 via-purple-600/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative px-4 py-6 pt-safe-top">
          {/* Top row with date and settings */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-dark-muted text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(new Date())}
            </div>
            <Link to="/settings" className="p-2 rounded-xl bg-dark-surface/50 backdrop-blur-sm text-dark-muted hover:text-white transition-all">
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-dark-muted text-sm">{getGreeting()}</p>
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              {profile?.username || 'Player'}
            </h1>
            <p className="text-sm text-primary-400">
              {getMotivation(completionRate, globalStreak)}
            </p>
          </motion.div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-2">
            {/* Streak */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "relative p-3 rounded-2xl text-center overflow-hidden",
                globalStreak > 0
                  ? "bg-gradient-to-br from-orange-500/30 to-red-500/20 border border-orange-500/30"
                  : "bg-dark-surface/80 border border-dark-border"
              )}
            >
              {globalStreak > 0 && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent" />
              )}
              <Flame className={cn(
                "w-6 h-6 mx-auto mb-1",
                globalStreak > 0 ? "text-orange-400" : "text-dark-muted"
              )} />
              <p className="text-xl font-bold text-white">{globalStreak}</p>
              <p className="text-[10px] text-dark-muted uppercase tracking-wide">Streak</p>
            </motion.div>

            {/* XP */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="relative p-3 rounded-2xl text-center bg-gradient-to-br from-primary-500/30 to-purple-500/20 border border-primary-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary-500/10 to-transparent" />
              <Zap className="w-6 h-6 mx-auto mb-1 text-primary-400" />
              <p className="text-xl font-bold text-white">{((profile?.xp || 0) / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-dark-muted uppercase tracking-wide">XP</p>
            </motion.div>

            {/* Rank */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative p-3 rounded-2xl text-center bg-dark-surface/80 border border-dark-border overflow-hidden"
            >
              <span className="text-2xl">{rankInfo.icon}</span>
              <p className={cn(
                "text-xs font-semibold truncate",
                `rank-${(profile?.rank || 'Novice').toLowerCase()}`
              )}>
                {profile?.rank || 'Novice'}
              </p>
              <p className="text-[10px] text-dark-muted uppercase tracking-wide">Rank</p>
            </motion.div>

            {/* Strikes */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className={cn(
                "relative p-3 rounded-2xl text-center overflow-hidden",
                weeklyStrikesUsed > 0
                  ? "bg-gradient-to-br from-red-500/30 to-pink-500/20 border border-red-500/30"
                  : "bg-dark-surface/80 border border-dark-border"
              )}
            >
              <Skull className={cn(
                "w-6 h-6 mx-auto mb-1",
                weeklyStrikesUsed > 0 ? "text-red-400" : "text-dark-muted"
              )} />
              <p className="text-xl font-bold text-white">{strikesRemaining}</p>
              <p className="text-[10px] text-dark-muted uppercase tracking-wide">Strikes</p>
            </motion.div>
          </div>

          {/* Rank progress */}
          {nextRank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-xl bg-dark-surface/50 backdrop-blur-sm border border-dark-border/50"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={cn("flex items-center gap-1", `rank-${(profile?.rank || 'Novice').toLowerCase()}`)}>
                  {rankInfo.icon} {profile?.rank || 'Novice'}
                </span>
                <span className="text-dark-muted">
                  {((nextRankInfo?.xpMin || 0) - (profile?.xp || 0)).toLocaleString()} XP to go
                </span>
                <span className={cn("flex items-center gap-1", `rank-${nextRank.toLowerCase()}`)}>
                  {nextRankInfo?.icon} {nextRank}
                </span>
              </div>
              <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${rankProgress * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4">
        {/* Today's progress card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 bg-gradient-to-br from-dark-card to-dark-surface border-dark-border/50"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Today's Quests</h2>
                <p className="text-xs text-dark-muted">{completedQuests.length} of {quests.length} completed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary-400">{completionRate}%</p>
            </div>
          </div>
          <div className="h-3 bg-dark-border rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                completionRate === 100
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-primary-500 to-purple-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {completionRate === 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mt-3 text-green-400"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">All quests completed!</span>
              <Sparkles className="w-4 h-4" />
            </motion.div>
          )}
        </motion.div>

        {/* Active quests */}
        {pendingQuests.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Active Quests
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                {pendingQuests.length} remaining
              </span>
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
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Completed
              </h2>
            </div>

            <div className="space-y-2">
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
            className="card text-center py-10 bg-gradient-to-br from-primary-900/30 to-purple-900/20 border-primary-500/30"
          >
            <div className="w-20 h-20 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Begin Your Journey
            </h3>
            <p className="text-dark-muted mb-6 max-w-xs mx-auto">
              Create your first track and start building habits that stick.
            </p>
            <Link to="/tracks/new" className="btn-primary inline-flex">
              <Plus className="w-5 h-5" />
              Create Your First Track
            </Link>
          </motion.div>
        )}

        {/* No quests for today */}
        {tracks.length > 0 && quests.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-10"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Rest Day
            </h3>
            <p className="text-dark-muted">
              No quests scheduled for today. Enjoy your break!
            </p>
          </motion.div>
        )}

        {/* Quick actions */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <Link
            to="/tracks/new"
            className="flex items-center gap-3 p-4 rounded-xl bg-dark-surface border border-dark-border hover:border-primary-500/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">New Track</p>
              <p className="text-xs text-dark-muted">Add a goal</p>
            </div>
          </Link>
          <Link
            to="/stats"
            className="flex items-center gap-3 p-4 rounded-xl bg-dark-surface border border-dark-border hover:border-primary-500/50 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-medium text-white">View Stats</p>
              <p className="text-xs text-dark-muted">Your progress</p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  )
}
