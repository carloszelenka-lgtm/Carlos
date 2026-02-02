import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User, Globe, Bell, Palette, Crown, Shield, LogOut,
  ChevronRight, Trash2, Download, Moon, Sun, Sparkles,
  CreditCard, AlertCircle, Check, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, getRankInfo } from '../lib/utils'

const STYLES = [
  { value: 'strict', label: 'Strict', desc: 'No excuses. Challenge days. Max progression.' },
  { value: 'balanced', label: 'Balanced', desc: 'Steady progress with flexibility.' },
  { value: 'chill', label: 'Chill', desc: 'Low pressure. Build habits gently.' }
]

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland'
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()
  const { theme, toggleTheme, cardTheme, setCardTheme } = useTheme()

  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    style: profile?.style || 'balanced',
    ai_enabled: profile?.ai_enabled || false
  })

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateProfile(formData)
    setSaving(false)

    if (error) {
      toast.error('Failed to save settings')
    } else {
      toast.success('Settings saved!')
    }
  }

  const handleExportData = () => {
    const data = {
      profile: profile,
      tracks: localStore.query(TABLES.TRACKS, t => t.user_id === user.id),
      quests: localStore.query(TABLES.QUESTS, q => q.user_id === user.id),
      quest_logs: localStore.query(TABLES.QUEST_LOGS, l => l.user_id === user.id),
      streaks: localStore.query(TABLES.STREAKS, s => s.user_id === user.id),
      exported_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `streakos-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Data exported!')
  }

  const handleDeleteAccount = () => {
    // Delete all user data
    localStore.query(TABLES.QUEST_LOGS, l => l.user_id === user.id)
      .forEach(l => localStore.delete(TABLES.QUEST_LOGS, l.id))
    localStore.query(TABLES.QUESTS, q => q.user_id === user.id)
      .forEach(q => localStore.delete(TABLES.QUESTS, q.id))
    localStore.query(TABLES.TRACKS, t => t.user_id === user.id)
      .forEach(t => localStore.delete(TABLES.TRACKS, t.id))
    localStore.query(TABLES.STREAKS, s => s.user_id === user.id)
      .forEach(s => localStore.delete(TABLES.STREAKS, s.id))
    localStore.query(TABLES.USERS_PROFILE, p => p.user_id === user.id)
      .forEach(p => localStore.delete(TABLES.USERS_PROFILE, p.id))

    signOut()
    toast.success('Account deleted')
    navigate('/welcome')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const rankInfo = getRankInfo(profile?.rank || 'Novice')

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <h1 className="text-2xl font-display font-bold text-white">Settings</h1>
      </header>

      <main className="px-4 space-y-4">
        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-400">
                {(profile?.username || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">@{profile?.username}</h2>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm", `rank-${(profile?.rank || 'Novice').toLowerCase()}`)}>
                  {rankInfo.icon} {profile?.rank || 'Novice'}
                </span>
                {profile?.is_pro && (
                  <span className="badge badge-primary">
                    <Crown className="w-3 h-3" />
                    Pro
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Timezone</label>
              <select
                className="input"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Style preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-3">Quest Style</h3>
          <div className="space-y-2">
            {STYLES.map(style => (
              <button
                key={style.value}
                onClick={() => setFormData({ ...formData, style: style.value })}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all",
                  formData.style === style.value
                    ? "bg-primary-500/20 border border-primary-500"
                    : "bg-dark-surface border border-dark-border hover:border-dark-muted"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{style.label}</span>
                  {formData.style === style.value && (
                    <Check className="w-5 h-5 text-primary-400" />
                  )}
                </div>
                <p className="text-sm text-dark-muted mt-1">{style.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Theme settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-3">Appearance</h3>
          <div className="space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 bg-dark-surface rounded-xl"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary-400" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
                <span className="text-white">Theme</span>
              </div>
              <span className="text-dark-muted capitalize">{theme}</span>
            </button>

            <div className="p-3 bg-dark-surface rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Palette className="w-5 h-5 text-primary-400" />
                <span className="text-white">Share Card Theme</span>
              </div>
              <div className="flex gap-2">
                {['dark', 'light'].map(t => (
                  <button
                    key={t}
                    onClick={() => setCardTheme(t)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                      cardTheme === t
                        ? "bg-primary-500 text-white"
                        : "bg-dark-border text-dark-muted"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI settings (Pro only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-400" />
              AI Personalization
            </h3>
            {!profile?.is_pro && (
              <span className="badge bg-dark-border text-dark-muted">Pro</span>
            )}
          </div>
          {profile?.is_pro ? (
            <button
              onClick={() => setFormData({ ...formData, ai_enabled: !formData.ai_enabled })}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                formData.ai_enabled
                  ? "bg-primary-500/20 border border-primary-500"
                  : "bg-dark-surface border border-dark-border"
              )}
            >
              <span className="text-white">Enable AI quests</span>
              <div className={cn(
                "w-12 h-6 rounded-full transition-all",
                formData.ai_enabled ? "bg-primary-500" : "bg-dark-border"
              )}>
                <div className={cn(
                  "w-5 h-5 rounded-full bg-white transition-all mt-0.5",
                  formData.ai_enabled ? "ml-6" : "ml-0.5"
                )} />
              </div>
            </button>
          ) : (
            <div className="p-3 bg-dark-surface rounded-xl">
              <p className="text-dark-muted text-sm mb-3">
                Upgrade to Pro for AI-personalized quest descriptions and coach feedback.
              </p>
              <button className="btn-primary w-full py-2 text-sm">
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </button>
            </div>
          )}
        </motion.div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Save Changes'
          )}
        </button>

        {/* Data management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-3">Data</h3>
          <div className="space-y-2">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-3 bg-dark-surface rounded-xl hover:bg-dark-border transition-all"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary-400" />
                <span className="text-white">Export Data</span>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-muted" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between p-3 bg-dark-surface rounded-xl hover:bg-danger/10 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-danger-light" />
                <span className="text-danger-light">Delete Account</span>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-muted group-hover:text-danger-light" />
            </button>
          </div>
        </motion.div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="btn-secondary w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4 text-danger-light">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Delete Account?</h3>
              </div>
              <p className="text-dark-muted mb-4">
                This will permanently delete all your data including tracks, quests, and progress. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn-danger flex-1"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  )
}
