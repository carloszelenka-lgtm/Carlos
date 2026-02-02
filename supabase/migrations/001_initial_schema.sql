-- StreakOS Database Schema
-- Run this migration to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Profile table
CREATE TABLE users_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  style VARCHAR(20) DEFAULT 'balanced' CHECK (style IN ('strict', 'balanced', 'chill')),
  xp INTEGER DEFAULT 0,
  rank VARCHAR(20) DEFAULT 'Novice',
  shields_available INTEGER DEFAULT 2,
  shields_used_this_week INTEGER DEFAULT 0,
  shield_week_start DATE DEFAULT CURRENT_DATE,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  ai_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  intent VARCHAR(20) NOT NULL CHECK (intent IN ('study', 'fitness', 'language', 'creative', 'skill', 'general')),
  difficulty_pref INTEGER DEFAULT 3 CHECK (difficulty_pref BETWEEN 1 AND 5),
  time_budget_min INTEGER DEFAULT 30,
  days_active JSONB DEFAULT '["mon","tue","wed","thu","fri","sat","sun"]'::jsonb,
  constraints TEXT,
  is_paused BOOLEAN DEFAULT FALSE,
  color VARCHAR(20) DEFAULT 'primary',
  icon VARCHAR(50) DEFAULT 'target',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quests table
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL,
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  mvp_instructions TEXT,
  mvp_minutes INTEGER DEFAULT 5,
  reward_xp INTEGER DEFAULT 50,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped', 'mvp_completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quest Logs table
CREATE TABLE quest_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  minutes_spent INTEGER,
  reflection_text TEXT,
  proof_type VARCHAR(20) CHECK (proof_type IN ('text', 'photo', 'none')),
  proof_url TEXT,
  xp_earned INTEGER,
  used_shield BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks table
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT FALSE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, track_id),
  UNIQUE(user_id, is_global) WHERE is_global = TRUE
);

-- Share Cards table
CREATE TABLE share_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  week_start_date DATE,
  card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('daily', 'weekly')),
  image_url TEXT,
  image_data TEXT,
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('quest', 'user', 'community', 'message')),
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags table
CREATE TABLE feature_flags (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Members table
CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Community Messages table
CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'achievement', 'quest_complete', 'streak')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tracks_user_id ON tracks(user_id);
CREATE INDEX idx_quests_user_id ON quests(user_id);
CREATE INDEX idx_quests_track_id ON quests(track_id);
CREATE INDEX idx_quests_date ON quests(date);
CREATE INDEX idx_quests_user_date ON quests(user_id, date);
CREATE INDEX idx_quest_logs_quest_id ON quest_logs(quest_id);
CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_share_cards_user_id ON share_cards(user_id);
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_messages_community_id ON community_messages(community_id);
CREATE INDEX idx_community_messages_created_at ON community_messages(created_at);

-- Row Level Security Policies
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can manage their own tracks
CREATE POLICY "Users can manage own tracks" ON tracks
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own quests
CREATE POLICY "Users can manage own quests" ON quests
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own quest logs
CREATE POLICY "Users can manage own quest logs" ON quest_logs
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own streaks
CREATE POLICY "Users can manage own streaks" ON streaks
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own share cards
CREATE POLICY "Users can manage own share cards" ON share_cards
  FOR ALL USING (auth.uid() = user_id);

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Community policies
CREATE POLICY "Members can view their communities" ON communities
  FOR SELECT USING (
    id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create communities" ON communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view community members" ON community_members
  FOR SELECT USING (
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can view community messages" ON community_messages
  FOR SELECT USING (
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can send messages" ON community_messages
  FOR INSERT WITH CHECK (
    community_id IN (SELECT community_id FROM community_members WHERE user_id = auth.uid())
    AND auth.uid() = user_id
  );

-- Insert default feature flags
INSERT INTO feature_flags (key, value, description) VALUES
  ('ai_enabled', 'true', 'Enable AI features globally'),
  ('max_free_tracks', '3', 'Maximum tracks for free users'),
  ('weekly_shields', '2', 'Number of shields per week'),
  ('challenge_day_enabled', 'true', 'Enable challenge day quests'),
  ('community_enabled', 'true', 'Enable community features');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
