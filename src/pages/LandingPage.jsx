import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Target, Trophy, Users, Zap, Shield, ChevronRight } from 'lucide-react'

const features = [
  {
    icon: Target,
    title: 'Track Goals',
    description: 'Create up to 10 goal tracks for study, fitness, language, creative, and more.'
  },
  {
    icon: Zap,
    title: 'Daily Quests',
    description: 'Get personalized daily quests that adapt to your performance.'
  },
  {
    icon: Trophy,
    title: 'Build Streaks',
    description: 'Stay consistent and watch your streaks grow. Earn XP and rank up.'
  },
  {
    icon: Shield,
    title: 'Streak Shields',
    description: 'Use shields to protect your streak on tough days with MVP fallbacks.'
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Join friends and hold each other accountable with shared progress.'
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 via-dark-bg to-dark-bg" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-glow-primary">
                <Flame className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
              Streak<span className="text-primary-400">OS</span>
            </h1>

            <p className="text-xl md:text-2xl text-dark-muted mb-8 max-w-2xl mx-auto">
              Your personal quest & streak game. Build habits, earn XP, and level up your life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn-primary w-full sm:w-auto text-lg px-8 py-4"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary w-full sm:w-auto text-lg px-8 py-4"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Everything you need to build habits
          </h2>
          <p className="text-dark-muted text-lg">
            A gamified system designed to keep you motivated and consistent.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card-hover p-6"
            >
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-dark-muted text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-dark-surface/50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-display font-bold text-white text-center mb-12">
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Tracks', desc: 'Set up goal tracks for the areas you want to improve.' },
              { step: '2', title: 'Complete Quests', desc: 'Get daily quests and complete them to earn XP.' },
              { step: '3', title: 'Build Streaks', desc: 'Stay consistent and watch your rank grow.' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-dark-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-display font-bold text-white mb-4">
          Ready to start your journey?
        </h2>
        <p className="text-dark-muted text-lg mb-8">
          Join thousands building better habits with StreakOS.
        </p>
        <Link
          to="/signup"
          className="btn-primary text-lg px-8 py-4 inline-flex"
        >
          Start Free Today
          <ChevronRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-dark-muted text-sm">
          <p>&copy; 2024 StreakOS. Build streaks. Complete quests. Level up your life.</p>
        </div>
      </footer>
    </div>
  )
}
