import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Target, BarChart3, Compass, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/tracks', icon: Target, label: 'Tracks' },
  { path: '/journeys', icon: Compass, label: 'Journeys' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
  { path: '/community', icon: Users, label: 'Community' },
]

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-surface/95 backdrop-blur-xl border-t border-dark-border safe-bottom z-50">
        <div className="max-w-lg mx-auto px-2">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center w-16 h-full"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 top-1 h-1 bg-primary-500 rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-primary-400' : 'text-dark-muted'
                  }`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                </NavLink>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
