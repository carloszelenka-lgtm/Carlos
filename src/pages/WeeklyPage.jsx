import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Trophy, Zap, Flame, Share2, Download, CheckCircle2,
  Shield, Target, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toPng } from 'html-to-image'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, getRankInfo, formatMinutes, getRandomCompletionMessage } from '../lib/utils'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameWeek } from 'date-fns'

export default function WeeklyPage() {
  const { user, profile } = useAuth()
  const cardRef = useRef(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekStats, setWeekStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (user) loadWeekStats()
  }, [user, weekOffset])

  const loadWeekStats = () => {
    const currentDate = weekOffset === 0 ? new Date() : addWeeks(new Date(), weekOffset)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

    const allQuests = localStore.query(TABLES.QUESTS, q => q.user_id === user.id)
    const allLogs = localStore.query(TABLES.QUEST_LOGS, l => l.user_id === user.id)

    // Filter quests for this week
    const weekQuests = allQuests.filter(q => {
      const questDate = new Date(q.date)
      return questDate >= weekStart && questDate <= weekEnd
    })

    const completedQuests = weekQuests.filter(q =>
      q.status === 'completed' || q.status === 'mvp_completed'
    )
    const mvpQuests = weekQuests.filter(q => q.status === 'mvp_completed')

    // Calculate XP earned this week
    const weekXP = completedQuests.reduce((sum, q) => {
      const isMVP = q.status === 'mvp_completed'
      return sum + (isMVP ? Math.round(q.reward_xp * 0.5) : q.reward_xp)
    }, 0)

    // Calculate time spent
    const weekLogs = allLogs.filter(l => {
      if (!l.created_at) return false
      const logDate = new Date(l.created_at)
      return logDate >= weekStart && logDate <= weekEnd
    })
    const totalMinutes = weekLogs.reduce((sum, l) => sum + (l.minutes_spent || 0), 0)

    // Daily breakdown
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const dailyStats = days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayQuests = weekQuests.filter(q => q.date === dateStr)
      const completed = dayQuests.filter(q =>
        q.status === 'completed' || q.status === 'mvp_completed'
      ).length

      return {
        date: dateStr,
        day: format(date, 'EEE'),
        total: dayQuests.length,
        completed,
        isToday: format(new Date(), 'yyyy-MM-dd') === dateStr
      }
    })

    // Consistency score (days with at least one completion)
    const daysWithActivity = dailyStats.filter(d => d.completed > 0).length
    const consistencyScore = Math.round((daysWithActivity / 7) * 100)

    // Calculate streak at end of week
    const globalStreak = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && s.is_global
    )[0]

    setWeekStats({
      weekStart,
      weekEnd,
      totalQuests: weekQuests.length,
      completedQuests: completedQuests.length,
      mvpSaves: mvpQuests.length,
      weekXP,
      totalMinutes,
      dailyStats,
      consistencyScore,
      currentStreak: globalStreak?.current_streak || 0,
      completionRate: weekQuests.length > 0
        ? Math.round((completedQuests.length / weekQuests.length) * 100)
        : 0,
      isCurrentWeek: weekOffset === 0
    })

    setLoading(false)
  }

  const handleShare = async () => {
    if (!cardRef.current) return

    setGenerating(true)

    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0f0f23'
      })

      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'streakos-weekly.png', { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My StreakOS Weekly Recap',
            text: `Check out my weekly progress! ${weekStats.completionRate}% completion rate.`,
            files: [file]
          })
          toast.success('Shared!')
        } else {
          downloadImage(dataUrl)
        }
      } else {
        downloadImage(dataUrl)
      }
    } catch (error) {
      console.error('Error generating card:', error)
      toast.error('Failed to generate card')
    }

    setGenerating(false)
  }

  const downloadImage = (dataUrl) => {
    const link = document.createElement('a')
    link.download = `streakos-weekly-${format(weekStats.weekStart, 'yyyy-MM-dd')}.png`
    link.href = dataUrl
    link.click()
    toast.success('Image downloaded!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const rankInfo = getRankInfo(profile?.rank || 'Novice')

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <h1 className="text-2xl font-display font-bold text-white">Weekly Recap</h1>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="btn-icon text-dark-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-dark-muted">
            {format(weekStats.weekStart, 'MMM d')} - {format(weekStats.weekEnd, 'MMM d, yyyy')}
          </span>
          <button
            onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
            className="btn-icon text-dark-muted"
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* Weekly card for sharing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          ref={cardRef}
          className="bg-gradient-to-br from-dark-surface via-dark-card to-primary-900/30 rounded-2xl border border-dark-border p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary-400" />
              <span className="font-display font-bold text-white">StreakOS</span>
            </div>
            <span className="text-sm text-dark-muted">
              Week of {format(weekStats.weekStart, 'MMM d')}
            </span>
          </div>

          {/* Main stats */}
          <div className="text-center mb-6">
            <p className="text-dark-muted text-sm mb-1">Completion Rate</p>
            <p className="text-5xl font-display font-bold text-white">
              {weekStats.completionRate}%
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
              <CheckCircle2 className="w-5 h-5 text-success-light mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{weekStats.completedQuests}</p>
              <p className="text-xs text-dark-muted">Completed</p>
            </div>
            <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 text-primary-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{weekStats.weekXP}</p>
              <p className="text-xs text-dark-muted">XP Earned</p>
            </div>
            <div className="bg-dark-bg/50 rounded-xl p-3 text-center">
              <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{weekStats.mvpSaves}</p>
              <p className="text-xs text-dark-muted">MVP Saves</p>
            </div>
          </div>

          {/* Daily breakdown */}
          <div className="mb-6">
            <p className="text-sm text-dark-muted mb-2">Daily Activity</p>
            <div className="flex justify-between gap-1">
              {weekStats.dailyStats.map(day => (
                <div key={day.date} className="flex-1 text-center">
                  <div
                    className={cn(
                      "h-16 rounded-lg mb-1 flex items-end justify-center overflow-hidden",
                      day.completed > 0 ? "bg-primary-500/20" : "bg-dark-border/30"
                    )}
                  >
                    {day.completed > 0 && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min((day.completed / Math.max(day.total, 1)) * 100, 100)}%` }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="w-full bg-primary-500 rounded-t-md"
                      />
                    )}
                  </div>
                  <p className={cn(
                    "text-xs",
                    day.isToday ? "text-primary-400 font-medium" : "text-dark-muted"
                  )}>
                    {day.day}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center justify-between border-t border-dark-border/50 pt-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-white font-medium">{weekStats.currentStreak} day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success-light" />
              <span className="text-white font-medium">{weekStats.consistencyScore}% consistency</span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-400">
                  {(profile?.username || 'U')[0].toUpperCase()}
                </span>
              </div>
              <span className="text-white font-medium">@{profile?.username}</span>
            </div>
            <span className={cn("text-sm", `rank-${(profile?.rank || 'Novice').toLowerCase()}`)}>
              {rankInfo.icon} {profile?.rank || 'Novice'}
            </span>
          </div>
        </motion.div>

        {/* Share button */}
        <button
          onClick={handleShare}
          disabled={generating}
          className="btn-primary w-full"
        >
          {generating ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Share2 className="w-5 h-5" />
          )}
          Share Weekly Recap
        </button>

        {/* Additional stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="font-semibold text-white mb-3">Week Details</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Total Quests</span>
              <span className="text-white font-medium">{weekStats.totalQuests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Time Invested</span>
              <span className="text-white font-medium">{formatMinutes(weekStats.totalMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted">Avg per Day</span>
              <span className="text-white font-medium">
                {Math.round(weekStats.completedQuests / 7 * 10) / 10} quests
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
