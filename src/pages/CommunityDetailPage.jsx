import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Copy, Settings, Send, Flame, Trophy,
  CheckCircle2, Shield, Crown, MoreVertical, UserMinus, LogOut, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, formatTimeAgo, getRankInfo } from '../lib/utils'

export default function CommunityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const messagesEndRef = useRef(null)
  const [activeTab, setActiveTab] = useState('chat')

  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [messages, setMessages] = useState([])
  const [memberProfiles, setMemberProfiles] = useState({})
  const [memberStats, setMemberStats] = useState({})
  const [userRole, setUserRole] = useState('member')
  const [loading, setLoading] = useState(true)

  const [newMessage, setNewMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (user) loadCommunity()
  }, [id, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadCommunity = () => {
    const comm = localStore.getOne(TABLES.COMMUNITIES, id)
    if (!comm) {
      navigate('/community')
      return
    }
    setCommunity(comm)

    // Load members
    const communityMembers = localStore.query(TABLES.COMMUNITY_MEMBERS, m => m.community_id === id)
    setMembers(communityMembers)

    // Find user role
    const userMembership = communityMembers.find(m => m.user_id === user.id)
    if (!userMembership) {
      navigate('/community')
      return
    }
    setUserRole(userMembership.role)

    // Load member profiles
    const profiles = {}
    const stats = {}
    communityMembers.forEach(member => {
      const memberProfile = localStore.query(TABLES.USERS_PROFILE, p => p.user_id === member.user_id)[0]
      if (memberProfile) {
        profiles[member.user_id] = memberProfile
      }

      // Load member stats
      const globalStreak = localStore.query(TABLES.STREAKS, s =>
        s.user_id === member.user_id && s.is_global
      )[0]

      const today = new Date().toISOString().split('T')[0]
      const todayQuests = localStore.query(TABLES.QUESTS, q =>
        q.user_id === member.user_id && q.date === today
      )
      const completedToday = todayQuests.filter(q =>
        q.status === 'completed' || q.status === 'mvp_completed'
      ).length

      stats[member.user_id] = {
        streak: globalStreak?.current_streak || 0,
        todayCompleted: completedToday,
        todayTotal: todayQuests.length,
        xp: memberProfile?.xp || 0,
        rank: memberProfile?.rank || 'Novice'
      }
    })
    setMemberProfiles(profiles)
    setMemberStats(stats)

    // Load messages
    const communityMessages = localStore.query(TABLES.COMMUNITY_MESSAGES, m => m.community_id === id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setMessages(communityMessages)

    setLoading(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: id,
      user_id: user.id,
      content: newMessage.trim(),
      message_type: 'text'
    })

    setNewMessage('')
    loadCommunity()
  }

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(community.invite_code)
    toast.success('Invite code copied!')
  }

  const handleLeave = () => {
    if (userRole === 'owner') {
      toast.error('Owners cannot leave. Transfer ownership first or delete the community.')
      return
    }

    // Remove membership
    const membership = members.find(m => m.user_id === user.id)
    if (membership) {
      localStore.delete(TABLES.COMMUNITY_MEMBERS, membership.id)
    }

    // Add leave message
    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: id,
      user_id: user.id,
      content: `${profile?.username || 'Someone'} left the community`,
      message_type: 'achievement'
    })

    toast.success('Left community')
    navigate('/community')
  }

  const handleDeleteCommunity = () => {
    // Delete all messages
    messages.forEach(m => localStore.delete(TABLES.COMMUNITY_MESSAGES, m.id))

    // Delete all memberships
    members.forEach(m => localStore.delete(TABLES.COMMUNITY_MEMBERS, m.id))

    // Delete community
    localStore.delete(TABLES.COMMUNITIES, id)

    toast.success('Community deleted')
    navigate('/community')
  }

  if (loading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border px-4 py-4 pt-safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/community')}
              className="text-dark-muted hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-semibold text-white">{community.name}</h1>
              <p className="text-xs text-dark-muted">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInviteCode}
              className="btn-icon text-dark-muted hover:text-white"
              title="Copy invite code"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-icon text-dark-muted hover:text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'chat'
                ? "bg-primary-500/20 text-primary-400"
                : "bg-dark-border/50 text-dark-muted"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'members'
                ? "bg-primary-500/20 text-primary-400"
                : "bg-dark-border/50 text-dark-muted"
            )}
          >
            Members
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => {
                const isOwn = message.user_id === user.id
                const senderProfile = memberProfiles[message.user_id]
                const isSystem = message.message_type === 'achievement'

                if (isSystem) {
                  return (
                    <div key={message.id} className="text-center">
                      <span className="text-xs text-dark-muted bg-dark-surface px-3 py-1 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  )
                }

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2", isOwn && "flex-row-reverse")}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      isOwn ? "bg-primary-500/20" : "bg-dark-surface"
                    )}>
                      <span className={cn(
                        "text-sm font-medium",
                        isOwn ? "text-primary-400" : "text-dark-muted"
                      )}>
                        {(senderProfile?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className={cn("max-w-[70%]", isOwn && "text-right")}>
                      {!isOwn && (
                        <p className="text-xs text-dark-muted mb-1">
                          {senderProfile?.username || 'Unknown'}
                        </p>
                      )}
                      <div className={cn(
                        "px-3 py-2 rounded-2xl",
                        isOwn
                          ? "bg-primary-500 text-white rounded-br-md"
                          : "bg-dark-surface text-dark-text rounded-bl-md"
                      )}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-[10px] text-dark-muted mt-1">
                        {formatTimeAgo(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-dark-surface border-t border-dark-border"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary px-4"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            {members.map(member => {
              const memberProfile = memberProfiles[member.user_id]
              const stats = memberStats[member.user_id] || {}
              const rankInfo = getRankInfo(stats.rank || 'Novice')
              const isOwn = member.user_id === user.id

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("card", isOwn && "border-primary-500/30")}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isOwn ? "bg-primary-500/20" : "bg-dark-surface"
                    )}>
                      <span className={cn(
                        "text-lg font-bold",
                        isOwn ? "text-primary-400" : "text-dark-muted"
                      )}>
                        {(memberProfile?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">
                          @{memberProfile?.username || 'Unknown'}
                        </h3>
                        {member.role === 'owner' && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                        {isOwn && (
                          <span className="text-xs text-primary-400">(you)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn("text-xs", `rank-${(stats.rank || 'Novice').toLowerCase()}`)}>
                          {rankInfo.icon} {stats.rank || 'Novice'}
                        </span>
                        <span className="text-xs text-dark-muted">
                          {(stats.xp || 0).toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Flame className={cn(
                          "w-4 h-4",
                          stats.streak > 0 ? "text-orange-400" : "text-dark-muted"
                        )} />
                        <span className="text-white font-medium">{stats.streak}</span>
                      </div>
                      <p className="text-xs text-dark-muted">
                        Today: {stats.todayCompleted}/{stats.todayTotal}
                      </p>
                    </div>
                  </div>

                  {/* Today's progress bar */}
                  {stats.todayTotal > 0 && (
                    <div className="mt-3">
                      <div className="progress-bar h-2">
                        <div
                          className="progress-fill bg-gradient-to-r from-primary-500 to-success"
                          style={{
                            width: `${(stats.todayCompleted / stats.todayTotal) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-surface w-full max-w-lg rounded-t-2xl p-4 safe-bottom"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Community Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-dark-card rounded-xl">
                <p className="text-sm text-dark-muted mb-1">Invite Code</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-white tracking-wider">
                    {community.invite_code}
                  </span>
                  <button
                    onClick={handleCopyInviteCode}
                    className="btn-secondary py-1 px-3 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>

              {userRole !== 'owner' && (
                <button
                  onClick={handleLeave}
                  className="w-full flex items-center gap-3 p-3 bg-dark-card rounded-xl text-danger-light hover:bg-danger/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Leave Community</span>
                </button>
              )}

              {userRole === 'owner' && (
                <button
                  onClick={handleDeleteCommunity}
                  className="w-full flex items-center gap-3 p-3 bg-dark-card rounded-xl text-danger-light hover:bg-danger/10 transition-all"
                >
                  <UserMinus className="w-5 h-5" />
                  <span>Delete Community</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
