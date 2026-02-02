import { Outlet, Link } from 'react-router-dom'
import { Flame } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/welcome" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-white">StreakOS</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-dark-muted text-sm">
        <p>Build streaks. Complete quests. Level up your life.</p>
      </footer>
    </div>
  )
}
