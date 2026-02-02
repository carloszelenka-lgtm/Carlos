import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, Copy, ChevronRight, Flame, Trophy,
  MessageCircle, Check, X, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { localStore, TABLES } from '../lib/localStore'
import { cn, generateInviteCode, getRankInfo } from '../lib/utils'

export default function CommunityPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [newCommunity, setNewCommunity] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) loadCommunities()
  }, [user])

  const loadCommunities = () => {
    // Get user's community memberships
    const memberships = localStore.query(TABLES.COMMUNITY_MEMBERS, m => m.user_id === user.id)
    const communityIds = memberships.map(m => m.community_id)

    // Get community details
    const userCommunities = localStore.get(TABLES.COMMUNITIES)
      .filter(c => communityIds.includes(c.id))
      .map(community => {
        const members = localStore.query(TABLES.COMMUNITY_MEMBERS, m => m.community_id === community.id)
        const messages = localStore.query(TABLES.COMMUNITY_MESSAGES, m => m.community_id === community.id)
        const lastMessage = messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

        return {
          ...community,
          memberCount: members.length,
          lastMessage,
          userRole: memberships.find(m => m.community_id === community.id)?.role
        }
      })

    setCommunities(userCommunities)
    setLoading(false)
  }

  const handleCreateCommunity = async () => {
    if (!newCommunity.name.trim()) {
      toast.error('Please enter a community name')
      return
    }

    setCreating(true)

    const inviteCode = generateInviteCode()

    // Create community
    const community = localStore.insert(TABLES.COMMUNITIES, {
      name: newCommunity.name.trim(),
      description: newCommunity.description.trim(),
      invite_code: inviteCode,
      created_by: user.id,
      is_private: true,
      max_members: 50
    })

    // Add creator as owner
    localStore.insert(TABLES.COMMUNITY_MEMBERS, {
      community_id: community.id,
      user_id: user.id,
      role: 'owner'
    })

    // Add welcome message
    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: community.id,
      user_id: user.id,
      content: `Welcome to ${community.name}! 🎉 Share your progress and hold each other accountable.`,
      message_type: 'text'
    })

    setCreating(false)
    setShowCreateModal(false)
    setNewCommunity({ name: '', description: '' })
    toast.success('Community created!')
    loadCommunities()

    // Show invite code
    toast((t) => (
      <div className="flex items-center gap-3">
        <span>Invite code: <strong>{inviteCode}</strong></span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(inviteCode)
            toast.dismiss(t.id)
            toast.success('Copied!')
          }}
          className="p-1 hover:bg-dark-border rounded"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    ), { duration: 10000 })
  }

  const handleJoinCommunity = () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) {
      toast.error('Please enter an invite code')
      return
    }

    // Find community by invite code
    const community = localStore.get(TABLES.COMMUNITIES)
      .find(c => c.invite_code === code)

    if (!community) {
      toast.error('Invalid invite code')
      return
    }

    // Check if already a member
    const existingMembership = localStore.query(TABLES.COMMUNITY_MEMBERS, m =>
      m.community_id === community.id && m.user_id === user.id
    )

    if (existingMembership.length > 0) {
      toast.error('You are already a member of this community')
      return
    }

    // Check member limit
    const memberCount = localStore.query(TABLES.COMMUNITY_MEMBERS, m =>
      m.community_id === community.id
    ).length

    if (memberCount >= community.max_members) {
      toast.error('This community is full')
      return
    }

    // Join community
    localStore.insert(TABLES.COMMUNITY_MEMBERS, {
      community_id: community.id,
      user_id: user.id,
      role: 'member'
    })

    // Add join message
    localStore.insert(TABLES.COMMUNITY_MESSAGES, {
      community_id: community.id,
      user_id: user.id,
      content: `${profile?.username || 'Someone'} joined the community!`,
      message_type: 'achievement'
    })

    setShowJoinModal(false)
    setJoinCode('')
    toast.success(`Joined ${community.name}!`)
    loadCommunities()
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
      {/* Header */}
      <header className="px-4 py-6 pt-safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Communities</h1>
            <p className="text-dark-muted text-sm">Stay accountable together</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn-secondary py-2 px-3"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary py-2 px-3"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4">
        {communities.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-12"
          >
            <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No communities yet
            </h3>
            <p className="text-dark-muted mb-4">
              Create a community or join one with an invite code.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-secondary"
              >
                Join Community
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Community
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {communities.map((community, index) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/community/${community.id}`}
                    className="card-hover block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
                            {community.name}
                          </h3>
                          {community.userRole === 'owner' && (
                            <span className="badge badge-primary text-xs">Owner</span>
                          )}
                        </div>
                        <p className="text-sm text-dark-muted truncate">
                          {community.lastMessage
                            ? community.lastMessage.content
                            : community.description || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-dark-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {community.memberCount}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-muted shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Join Community</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Invite Code</label>
                <input
                  type="text"
                  className="input uppercase font-mono tracking-wider"
                  placeholder="ABCD1234"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
              <button
                onClick={handleJoinCommunity}
                className="btn-primary w-full"
              >
                Join Community
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-sm w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Create Community</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Study Squad, Fitness Friends"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  className="input min-h-[60px]"
                  placeholder="What's this community about?"
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  maxLength={200}
                />
              </div>
              <button
                onClick={handleCreateCommunity}
                disabled={creating}
                className="btn-primary w-full"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Community
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
