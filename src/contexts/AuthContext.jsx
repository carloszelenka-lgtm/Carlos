import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isLocalMode } from '../lib/supabase'
import { localStore, TABLES } from '../lib/localStore'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLocalMode) {
      // Check for local user
      const localUser = localStore.getCurrentUser()
      if (localUser) {
        setUser(localUser)
        const profiles = localStore.query(TABLES.USERS_PROFILE, p => p.user_id === localUser.id)
        if (profiles.length > 0) {
          setProfile(profiles[0])
        }
      }
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    if (isLocalMode) {
      const profiles = localStore.query(TABLES.USERS_PROFILE, p => p.user_id === userId)
      if (profiles.length > 0) {
        setProfile(profiles[0])
      }
      return profiles[0]
    }

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
      return data
    }
    return null
  }

  const signUp = async ({ email, password, username }) => {
    if (isLocalMode) {
      // Create local user
      const newUser = {
        id: crypto.randomUUID(),
        email,
        created_at: new Date().toISOString()
      }

      // Check if username exists
      const existingUser = localStore.query(TABLES.USERS_PROFILE, p => p.username === username)
      if (existingUser.length > 0) {
        return { error: { message: 'Username already taken' } }
      }

      localStore.setCurrentUser(newUser)

      // Create profile
      const newProfile = localStore.insert(TABLES.USERS_PROFILE, {
        user_id: newUser.id,
        username,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        style: 'balanced',
        xp: 0,
        rank: 'Novice',
        shields_available: 2,
        shields_used_this_week: 0,
        role: 'user',
        is_pro: false,
        ai_enabled: false
      })

      // Create global streak
      localStore.insert(TABLES.STREAKS, {
        user_id: newUser.id,
        track_id: null,
        is_global: true,
        current_streak: 0,
        best_streak: 0
      })

      setUser(newUser)
      setProfile(newProfile)
      return { data: { user: newUser }, error: null }
    }

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (!error && data.user) {
      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .insert({
          user_id: data.user.id,
          username,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
        .select()
        .single()

      if (!profileError) {
        // Create global streak
        await supabase.from('streaks').insert({
          user_id: data.user.id,
          is_global: true,
          current_streak: 0,
          best_streak: 0
        })
      }
    }

    return { data, error }
  }

  const signIn = async ({ email, password }) => {
    if (isLocalMode) {
      // Find user by email in profiles
      const profiles = localStore.get(TABLES.USERS_PROFILE)
      const user = localStore.getCurrentUser()

      if (user && user.email === email) {
        const profile = profiles.find(p => p.user_id === user.id)
        setUser(user)
        setProfile(profile)
        return { data: { user }, error: null }
      }

      return { error: { message: 'Invalid credentials. In demo mode, please sign up first.' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    if (isLocalMode) {
      localStore.clearCurrentUser()
      setUser(null)
      setProfile(null)
      return { error: null }
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const updateProfile = async (updates) => {
    if (isLocalMode) {
      const updated = localStore.update(TABLES.USERS_PROFILE, profile.id, updates)
      if (updated) {
        setProfile(updated)
      }
      return { data: updated, error: null }
    }

    const { data, error } = await supabase
      .from('users_profile')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
    }
    return { data, error }
  }

  const addXP = async (amount) => {
    const newXP = (profile?.xp || 0) + amount
    const newRank = calculateRank(newXP)
    return updateProfile({ xp: newXP, rank: newRank })
  }

  const calculateRank = (xp) => {
    if (xp >= 50000) return 'Legend'
    if (xp >= 25000) return 'Grandmaster'
    if (xp >= 10000) return 'Master'
    if (xp >= 5000) return 'Expert'
    if (xp >= 2000) return 'Journeyman'
    if (xp >= 500) return 'Apprentice'
    return 'Novice'
  }

  const useShield = async () => {
    if (!profile || profile.shields_available <= 0) {
      return { error: { message: 'No shields available' } }
    }

    return updateProfile({
      shields_available: profile.shields_available - 1,
      shields_used_this_week: profile.shields_used_this_week + 1
    })
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    addXP,
    useShield,
    fetchProfile,
    isLocalMode
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
