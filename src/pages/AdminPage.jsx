import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Shield, Users, Flag, Settings, AlertTriangle,
  Check, X, Ban, Eye, ChevronDown, Search, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, formatTimeAgo } from '../lib/utils'

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('reports')
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [featureFlags, setFeatureFlags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/')
      return
    }
    loadData()
  }, [profile])

  const loadData = () => {
    // Load reports
    const allReports = localStore.get(TABLES.REPORTS)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setReports(allReports)

    // Load users
    const allUsers = localStore.get(TABLES.USERS_PROFILE)
    setUsers(allUsers)

    // Load feature flags
    const flags = localStore.get(TABLES.FEATURE_FLAGS)
    if (flags.length === 0) {
      // Initialize default flags
      const defaultFlags = [
        { key: 'ai_enabled', value: true, description: 'Enable AI features globally' },
        { key: 'max_free_tracks', value: 3, description: 'Maximum tracks for free users' },
        { key: 'weekly_shields', value: 2, description: 'Number of shields per week' },
        { key: 'community_enabled', value: true, description: 'Enable community features' }
      ]
      defaultFlags.forEach(flag => localStore.insert(TABLES.FEATURE_FLAGS, flag))
      setFeatureFlags(defaultFlags)
    } else {
      setFeatureFlags(flags)
    }

    setLoading(false)
  }

  const handleResolveReport = (reportId, status) => {
    localStore.update(TABLES.REPORTS, reportId, {
      status,
      resolved_by: user.id,
      resolved_at: new Date().toISOString()
    })
    toast.success(`Report ${status}`)
    loadData()
  }

  const handleToggleUserBan = (userId, currentlyBanned) => {
    // In a real app, this would update auth status
    localStore.update(TABLES.USERS_PROFILE, userId, {
      is_banned: !currentlyBanned
    })
    toast.success(currentlyBanned ? 'User unbanned' : 'User banned')
    loadData()
  }

  const handleUpdateFlag = (flagId, newValue) => {
    localStore.update(TABLES.FEATURE_FLAGS, flagId, { value: newValue })
    toast.success('Flag updated')
    loadData()
  }

  const handleMakeAdmin = (userId) => {
    localStore.update(TABLES.USERS_PROFILE, userId, { role: 'admin' })
    toast.success('User is now admin')
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const pendingReports = reports.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-4 pt-safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-dark-muted hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-400" />
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'reports'
                ? "bg-primary-500/20 text-primary-400"
                : "bg-dark-border/50 text-dark-muted"
            )}
          >
            <Flag className="w-4 h-4" />
            Reports
            {pendingReports.length > 0 && (
              <span className="w-5 h-5 bg-danger rounded-full text-white text-xs flex items-center justify-center">
                {pendingReports.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'users'
                ? "bg-primary-500/20 text-primary-400"
                : "bg-dark-border/50 text-dark-muted"
            )}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('flags')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'flags'
                ? "bg-primary-500/20 text-primary-400"
                : "bg-dark-border/50 text-dark-muted"
            )}
          >
            <Settings className="w-4 h-4" />
            Flags
          </button>
        </div>
      </header>

      <main className="px-4 py-4">
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="card text-center py-8">
                <Flag className="w-12 h-12 text-dark-muted mx-auto mb-3" />
                <p className="text-dark-muted">No reports yet</p>
              </div>
            ) : (
              reports.map(report => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "card",
                    report.status === 'pending' && "border-warning/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={cn(
                        "badge",
                        report.status === 'pending' ? "badge-warning" :
                        report.status === 'resolved' ? "badge-success" : "badge-primary"
                      )}>
                        {report.status}
                      </span>
                      <span className="text-xs text-dark-muted ml-2">
                        {formatTimeAgo(report.created_at)}
                      </span>
                    </div>
                    <span className="text-xs text-dark-muted">
                      {report.target_type}
                    </span>
                  </div>

                  <p className="text-white font-medium">{report.reason}</p>
                  {report.details && (
                    <p className="text-sm text-dark-muted mt-1">{report.details}</p>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleResolveReport(report.id, 'resolved')}
                        className="btn-success flex-1 py-2 text-sm"
                      >
                        <Check className="w-4 h-4" />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'dismissed')}
                        className="btn-secondary flex-1 py-2 text-sm"
                      >
                        <X className="w-4 h-4" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="text-sm text-dark-muted mb-2">
              {users.length} total users
            </div>
            {users.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-400">
                        {(u.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white">@{u.username}</h3>
                        {u.role === 'admin' && (
                          <Shield className="w-4 h-4 text-primary-400" />
                        )}
                        {u.is_pro && (
                          <span className="badge badge-primary text-xs">Pro</span>
                        )}
                        {u.is_banned && (
                          <span className="badge badge-danger text-xs">Banned</span>
                        )}
                      </div>
                      <p className="text-xs text-dark-muted">
                        {u.xp?.toLocaleString() || 0} XP • {u.rank || 'Novice'}
                      </p>
                    </div>
                  </div>

                  {u.user_id !== user.id && (
                    <div className="flex gap-2">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleMakeAdmin(u.id)}
                          className="btn-icon text-dark-muted hover:text-primary-400"
                          title="Make admin"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleUserBan(u.id, u.is_banned)}
                        className={cn(
                          "btn-icon",
                          u.is_banned
                            ? "text-success-light hover:text-success"
                            : "text-dark-muted hover:text-danger-light"
                        )}
                        title={u.is_banned ? "Unban" : "Ban"}
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'flags' && (
          <div className="space-y-3">
            {featureFlags.map(flag => (
              <motion.div
                key={flag.id || flag.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white font-mono">{flag.key}</h3>
                    <p className="text-sm text-dark-muted">{flag.description}</p>
                  </div>

                  {typeof flag.value === 'boolean' ? (
                    <button
                      onClick={() => handleUpdateFlag(flag.id, !flag.value)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all",
                        flag.value ? "bg-primary-500" : "bg-dark-border"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full bg-white transition-all mt-0.5",
                        flag.value ? "ml-6" : "ml-0.5"
                      )} />
                    </button>
                  ) : (
                    <input
                      type="number"
                      className="input w-20 text-center py-1"
                      value={flag.value}
                      onChange={(e) => handleUpdateFlag(flag.id, parseInt(e.target.value) || 0)}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
