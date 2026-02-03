import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Copy, Send, Flame, Trophy,
  CheckCircle2, Shield, Crown, MoreVertical, UserMinus, LogOut, X,
  Bell, Target, Play, Award, Plus, Check, XCircle, Clock,
  Trash2, TrendingUp, UserPlus
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
  const [proposals, setProposals] = useState([])
  const [showProposeTask, setShowProposeTask] = useState(false)
  const [proposalForm, setProposalForm] = useState({
    taskName: '',
    description: '',
    time_budget_min: 30
  })

  useEffect(() => {
    if (user) loadCommunity()
  }, [id, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages, activeTab])

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

    // Load task proposals
    const communityProposals = localStore.query(TABLES.TASK_PROPOSALS, p => p.community_id === id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setProposals(communityProposals)

    setLoading(false)
  }

  const handleProposeTask = () => {
    if (!proposalForm.taskName.trim()) {
      toast.error('Enter a task name')
      return
    }

    const proposal = {
      community_id: id,
      from_user_id: user.id,
      task_name: proposalForm.taskName.trim(),
      description: proposalForm.description.trim(),
      time_budget_min: proposalForm.time_budget_min,
      status: 'pending',
      accepted_by: [] // Track who has accepted
    }

    localStore.insert(TABLES.TASK_PROPOSALS, proposal)

    // Add activity message
    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: id,
      user_id: user.id,
      content: `proposed a task: "${proposalForm.taskName.trim()}"`,
      message_type: 'proposal'
    })

    loadCommunity()
    setShowProposeTask(false)
    setProposalForm({ taskName: '', description: '', time_budget_min: 30 })
    toast.success('Task proposed to the community!')
  }

  const handleAcceptProposal = (proposal) => {
    // Create the track for this user
    const track = {
      user_id: user.id,
      name: proposal.task_name,
      description: proposal.description || `Community task proposed by ${memberProfiles[proposal.from_user_id]?.username}`,
      intent: 'general',
      time_budget_min: proposal.time_budget_min,
      difficulty_pref: 3,
      days_active: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      is_paused: false
    }

    localStore.insert(TABLES.TRACKS, track)

    // Track that this user accepted (proposal stays open for others)
    const acceptedBy = proposal.accepted_by || []
    localStore.update(TABLES.TASK_PROPOSALS, proposal.id, {
      accepted_by: [...acceptedBy, user.id]
    })

    // Add activity message
    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: id,
      user_id: user.id,
      content: `accepted the community task "${proposal.task_name}"`,
      message_type: 'quest_created'
    })

    loadCommunity()
    toast.success('Task added to your tracks!')
  }

  const handleDismissProposal = (proposal) => {
    // Just hide it for this user by adding to dismissed list
    const dismissedBy = proposal.dismissed_by || []
    localStore.update(TABLES.TASK_PROPOSALS, proposal.id, {
      dismissed_by: [...dismissedBy, user.id]
    })
    loadCommunity()
    toast.success('Proposal hidden')
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
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
      message_type: 'system'
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

  // Get activity icon based on message type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'quest_created': return <Target className="w-4 h-4 text-blue-400" />
      case 'quest_started': return <Play className="w-4 h-4 text-yellow-400" />
      case 'quest_completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case 'streak': return <Flame className="w-4 h-4 text-orange-400" />
      case 'rank_up': return <Award className="w-4 h-4 text-purple-400" />
      default: return <Bell className="w-4 h-4 text-primary-400" />
    }
  }

  if (loading || !community) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-dark-bg">
      {/* Header - Fixed at top */}
      <header className="shrink-0 bg-dark-surface border-b border-dark-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/community')}
              className="text-dark-muted hover:text-white p-1"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-semibold text-white">{community.name}</h1>
              <p className="text-xs text-dark-muted">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyInviteCode}
              className="p-2 text-dark-muted hover:text-white hover:bg-dark-border rounded-lg transition-all"
              title="Copy invite code"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-dark-muted hover:text-white hover:bg-dark-border rounded-lg transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {['chat', 'activity', 'proposals', 'members'].map(tab => {
            // Count proposals not yet accepted/dismissed by this user
            const pendingCount = tab === 'proposals'
              ? proposals.filter(p =>
                  p.status === 'pending' &&
                  p.from_user_id !== user.id &&
                  !(p.accepted_by || []).includes(user.id) &&
                  !(p.dismissed_by || []).includes(user.id)
                ).length
              : 0
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all relative",
                  activeTab === tab
                    ? "bg-primary-500/20 text-primary-400"
                    : "bg-dark-border/50 text-dark-muted hover:text-white"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-light text-white text-xs rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content - Scrollable middle section */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dark-muted">No messages yet. Say hi! 👋</p>
              </div>
            ) : (
              messages.filter(m => m.message_type === 'text' || m.message_type === 'system').map((message) => {
                const isOwn = message.user_id === user.id
                const senderProfile = memberProfiles[message.user_id]
                const isSystem = message.message_type === 'system'

                if (isSystem) {
                  return (
                    <div key={message.id} className="text-center py-2">
                      <span className="text-xs text-dark-muted bg-dark-surface/50 px-3 py-1.5 rounded-full">
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
                      isOwn ? "bg-primary-500" : "bg-dark-surface"
                    )}>
                      <span className={cn(
                        "text-sm font-medium",
                        isOwn ? "text-white" : "text-dark-muted"
                      )}>
                        {(senderProfile?.username || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                      {!isOwn && (
                        <p className="text-xs text-dark-muted mb-1 ml-1">
                          {senderProfile?.username || 'Unknown'}
                        </p>
                      )}
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl inline-block text-left",
                        isOwn
                          ? "bg-primary-500 text-white rounded-br-sm"
                          : "bg-dark-surface text-dark-text rounded-bl-sm"
                      )}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <p className={cn(
                        "text-[10px] text-dark-muted mt-1",
                        isOwn ? "mr-1" : "ml-1"
                      )}>
                        {formatTimeAgo(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input - Fixed at bottom */}
          <form
            onSubmit={handleSendMessage}
            className="shrink-0 p-3 bg-dark-surface border-t border-dark-border"
          >
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-dark-card border border-dark-border rounded-full px-4 py-2.5 text-white placeholder-dark-muted focus:outline-none focus:border-primary-500 transition-all"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className={cn(
                  "p-2.5 rounded-full transition-all",
                  newMessage.trim()
                    ? "bg-primary-500 text-white"
                    : "bg-dark-border text-dark-muted"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.filter(m => m.message_type !== 'text' && m.message_type !== 'system').length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-dark-muted mx-auto mb-3" />
              <p className="text-dark-muted">No activity yet</p>
              <p className="text-xs text-dark-muted mt-1">Member activities will appear here</p>
            </div>
          ) : (
            messages
              .filter(m => m.message_type !== 'text' && m.message_type !== 'system')
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((activity) => {
                const senderProfile = memberProfiles[activity.user_id]
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-dark-surface rounded-xl"
                  >
                    {getActivityIcon(activity.message_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">{senderProfile?.username || 'Someone'}</span>
                        {' '}{activity.content}
                      </p>
                      <p className="text-xs text-dark-muted">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </motion.div>
                )
              })
          )}
        </div>
      )}

      {/* Proposals Tab */}
      {activeTab === 'proposals' && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Propose Task Button */}
          <button
            onClick={() => setShowProposeTask(true)}
            className="w-full btn-primary mb-4"
          >
            <Plus className="w-5 h-5" />
            Propose a Task
          </button>

          {/* Community Proposals - Available for everyone to accept */}
          {proposals.filter(p =>
            p.status === 'pending' &&
            p.from_user_id !== user.id &&
            !(p.accepted_by || []).includes(user.id) &&
            !(p.dismissed_by || []).includes(user.id)
          ).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Community Proposals</h3>
              <div className="space-y-3">
                {proposals
                  .filter(p =>
                    p.status === 'pending' &&
                    p.from_user_id !== user.id &&
                    !(p.accepted_by || []).includes(user.id) &&
                    !(p.dismissed_by || []).includes(user.id)
                  )
                  .map(proposal => {
                    const fromProfile = memberProfiles[proposal.from_user_id]
                    const acceptedCount = (proposal.accepted_by || []).length
                    return (
                      <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-dark-surface rounded-xl p-4 border border-primary-500/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-white">{proposal.task_name}</h4>
                            <p className="text-xs text-dark-muted">
                              Proposed by @{fromProfile?.username || 'Unknown'} • {proposal.time_budget_min} min
                              {acceptedCount > 0 && ` • ${acceptedCount} accepted`}
                            </p>
                          </div>
                          <Target className="w-5 h-5 text-primary-400" />
                        </div>
                        {proposal.description && (
                          <p className="text-sm text-dark-muted mb-3">{proposal.description}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptProposal(proposal)}
                            className="flex-1 btn-primary py-2 text-sm"
                          >
                            <Check className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleDismissProposal(proposal)}
                            className="flex-1 btn-secondary py-2 text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* My Proposals */}
          {proposals.filter(p => p.from_user_id === user.id).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Your Proposals</h3>
              <div className="space-y-2">
                {proposals
                  .filter(p => p.from_user_id === user.id)
                  .map(proposal => {
                    const acceptedCount = (proposal.accepted_by || []).length
                    return (
                      <div
                        key={proposal.id}
                        className="bg-dark-surface rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-white">{proposal.task_name}</p>
                          <p className="text-xs text-dark-muted">
                            {acceptedCount} member{acceptedCount !== 1 ? 's' : ''} accepted
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          active
                        </span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {proposals.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-dark-muted mx-auto mb-3" />
              <p className="text-dark-muted">No proposals yet</p>
              <p className="text-xs text-dark-muted mt-1">Propose tasks for the whole community!</p>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                className={cn(
                  "bg-dark-surface rounded-xl p-4 border",
                  isOwn ? "border-primary-500/30" : "border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    isOwn ? "bg-primary-500" : "bg-dark-card"
                  )}>
                    <span className={cn(
                      "text-lg font-bold",
                      isOwn ? "text-white" : "text-dark-muted"
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
                        <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded-full">you</span>
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
                      <span className="text-white font-bold">{stats.streak}</span>
                    </div>
                    <p className="text-xs text-dark-muted mt-0.5">
                      {stats.todayCompleted}/{stats.todayTotal} today
                    </p>
                  </div>
                </div>

                {/* Today's progress bar */}
                {stats.todayTotal > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-dark-card rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.todayCompleted / stats.todayTotal) * 100}%` }}
                        className="h-full bg-gradient-to-r from-primary-500 to-success rounded-full"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Propose Task Modal */}
      <AnimatePresence>
        {showProposeTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowProposeTask(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-surface w-full max-w-sm rounded-2xl p-5 border border-dark-border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Propose a Task</h3>
                <button
                  onClick={() => setShowProposeTask(false)}
                  className="p-1 text-dark-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-dark-muted mb-4">
                Propose a task for the entire community. Members can choose to accept it.
              </p>

              <div className="space-y-4">
                {/* Task Name */}
                <div>
                  <label className="label">Task Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Morning workout, Read 20 pages"
                    value={proposalForm.taskName}
                    onChange={(e) => setProposalForm({ ...proposalForm, taskName: e.target.value })}
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">Why? (optional)</label>
                  <textarea
                    className="input min-h-[60px]"
                    placeholder="Add some encouragement or context..."
                    value={proposalForm.description}
                    onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                    maxLength={200}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="label">Duration ({proposalForm.time_budget_min} min)</label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={proposalForm.time_budget_min}
                    onChange={(e) => setProposalForm({ ...proposalForm, time_budget_min: parseInt(e.target.value) })}
                    className="w-full accent-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowProposeTask(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProposeTask}
                  className="btn-primary flex-1"
                >
                  Propose
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal - Centered */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark-surface w-full max-w-sm rounded-2xl p-5 border border-dark-border shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">Community Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-dark-muted hover:text-white hover:bg-dark-border rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Invite Code */}
                <div className="p-4 bg-dark-card rounded-xl">
                  <p className="text-xs text-dark-muted mb-2">Invite Code</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl text-white tracking-widest">
                      {community.invite_code}
                    </span>
                    <button
                      onClick={handleCopyInviteCode}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-500/30 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>

                {/* Leave/Delete buttons */}
                {userRole !== 'owner' ? (
                  <button
                    onClick={handleLeave}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-danger/10 text-danger-light rounded-xl hover:bg-danger/20 transition-all font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Leave Community
                  </button>
                ) : (
                  <button
                    onClick={handleDeleteCommunity}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-danger/10 text-danger-light rounded-xl hover:bg-danger/20 transition-all font-medium"
                  >
                    <UserMinus className="w-5 h-5" />
                    Delete Community
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
