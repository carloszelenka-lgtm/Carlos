import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

// Layout
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

// App pages
import HomePage from './pages/HomePage'
import TracksPage from './pages/TracksPage'
import TrackDetailPage from './pages/TrackDetailPage'
import CreateTrackPage from './pages/CreateTrackPage'
import QuestPage from './pages/QuestPage'
import StatsPage from './pages/StatsPage'
import WeeklyPage from './pages/WeeklyPage'
import SettingsPage from './pages/SettingsPage'
import CommunityPage from './pages/CommunityPage'
import CommunityDetailPage from './pages/CommunityDetailPage'
import JourneysPage from './pages/JourneysPage'
import JourneyDetailPage from './pages/JourneyDetailPage'
import AdminPage from './pages/AdminPage'
import LandingPage from './pages/LandingPage'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Admin Route wrapper
function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-dark-muted">Loading StreakOS...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/welcome" element={<LandingPage />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />
      </Route>

      {/* Protected app routes */}
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<HomePage />} />
        <Route path="/tracks" element={<TracksPage />} />
        <Route path="/tracks/new" element={<CreateTrackPage />} />
        <Route path="/tracks/:id" element={<TrackDetailPage />} />
        <Route path="/quest/:id" element={<QuestPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/community/:id" element={<CommunityDetailPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/:id" element={<JourneyDetailPage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/welcome"} replace />} />
    </Routes>
  )
}

export default App
