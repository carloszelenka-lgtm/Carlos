import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Flame, Trophy, Zap, Calendar, TrendingUp, Target,
  CheckCircle2, Shield, Clock
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, getRankInfo, formatMinutes } from '../lib/utils'
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function StatsPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadStats()
  }, [user])

  const loadStats = () => {
    const allQuests = localStore.query(TABLES.QUESTS, q => q.user_id === user.id)
    const allTracks = localStore.query(TABLES.TRACKS, t => t.user_id === user.id)
    const allLogs = localStore.query(TABLES.QUEST_LOGS, l => l.user_id === user.id)
    const globalStreak = localStore.query(TABLES.STREAKS, s =>
      s.user_id === user.id && s.is_global
    )[0]

    // Calculate stats
    const completedQuests = allQuests.filter(q =>
      q.status === 'completed' || q.status === 'mvp_completed'
    )
    const mvpCompletions = allQuests.filter(q => q.status === 'mvp_completed')
    const totalXP = allLogs.reduce((sum, log) => sum + (log.xp_earned || 0), 0)
    const totalMinutes = allLogs.reduce((sum, log) => sum + (log.minutes_spent || 0), 0)

    // Last 7 days data
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayQuests = allQuests.filter(q => q.date === dateStr)
      const completed = dayQuests.filter(q =>
        q.status === 'completed' || q.status === 'mvp_completed'
      ).length

      last7Days.push({
        date: dateStr,
        label: format(date, 'EEE'),
        total: dayQuests.length,
        completed,
        xp: dayQuests.filter(q => q.status === 'completed' || q.status === 'mvp_completed')
          .reduce((sum, q) => sum + q.reward_xp, 0)
      })
    }

    // Last 30 days XP trend
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayLogs = allLogs.filter(l =>
        l.created_at && l.created_at.startsWith(dateStr)
      )
      const dayXP = dayLogs.reduce((sum, l) => sum + (l.xp_earned || 0), 0)
      last30Days.push({
        date: dateStr,
        label: format(date, 'MMM d'),
        xp: dayXP
      })
    }

    setStats({
      totalQuests: allQuests.length,
      completedQuests: completedQuests.length,
      mvpCompletions: mvpCompletions.length,
      totalXP,
      totalMinutes,
      activeTracks: allTracks.filter(t => !t.is_paused).length,
      currentStreak: globalStreak?.current_streak || 0,
      bestStreak: globalStreak?.best_streak || 0,
      last7Days,
      last30Days,
      completionRate: allQuests.length > 0
        ? Math.round((completedQuests.length / allQuests.length) * 100)
        : 0
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const rankInfo = getRankInfo(profile?.rank || 'Novice')

  const completionChartData = {
    labels: stats.last7Days.map(d => d.label),
    datasets: [
      {
        label: 'Completed',
        data: stats.last7Days.map(d => d.completed),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Total',
        data: stats.last7Days.map(d => d.total - d.completed),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderRadius: 6
      }
    ]
  }

  const xpChartData = {
    labels: stats.last30Days.filter((_, i) => i % 5 === 0).map(d => d.label),
    datasets: [
      {
        label: 'XP Earned',
        data: stats.last30Days.map(d => d.xp),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9898b8' }
      },
      y: {
        grid: { color: '#2d2d5a' },
        ticks: { color: '#9898b8' }
      }
    }
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <h1 className="text-2xl font-display font-bold text-white">Stats</h1>
        <p className="text-dark-muted">Your performance overview</p>
      </header>

      <main className="px-4 space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-dark-muted text-sm">Current Streak</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
            <p className="text-xs text-dark-muted">Best: {stats.bestStreak}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary-400" />
              <span className="text-dark-muted text-sm">Total XP</span>
            </div>
            <p className="text-3xl font-bold text-white">{(profile?.xp || 0).toLocaleString()}</p>
            <p className={cn("text-xs", `rank-${(profile?.rank || 'Novice').toLowerCase()}`)}>
              {rankInfo.icon} {profile?.rank || 'Novice'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-success-light" />
              <span className="text-dark-muted text-sm">Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.completionRate}%</p>
            <p className="text-xs text-dark-muted">{stats.completedQuests} completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-dark-muted text-sm">Time Invested</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatMinutes(stats.totalMinutes)}</p>
            <p className="text-xs text-dark-muted">{stats.mvpCompletions} MVP saves</p>
          </motion.div>
        </div>

        {/* Completion chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="font-semibold text-white mb-4">Last 7 Days</h2>
          <div className="h-48">
            <Bar data={completionChartData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                x: { ...chartOptions.scales.x, stacked: true },
                y: { ...chartOptions.scales.y, stacked: true }
              }
            }} />
          </div>
        </motion.div>

        {/* XP trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card"
        >
          <h2 className="font-semibold text-white mb-4">XP Trend (30 Days)</h2>
          <div className="h-48">
            <Line data={xpChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* More stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="font-semibold text-white mb-3">All Time</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-muted flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active Tracks
              </span>
              <span className="text-white font-medium">{stats.activeTracks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Total Quests
              </span>
              <span className="text-white font-medium">{stats.totalQuests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted flex items-center gap-2">
                <Shield className="w-4 h-4" />
                MVP Completions
              </span>
              <span className="text-white font-medium">{stats.mvpCompletions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-muted flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Best Streak
              </span>
              <span className="text-white font-medium">{stats.bestStreak} days</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
