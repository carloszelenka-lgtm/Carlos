import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail, isValidUsername } from '../lib/utils'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, isLocalMode } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!isValidUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscore)'
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    const { error } = await signUp(formData)

    if (error) {
      toast.error(error.message || 'Failed to create account')
      setLoading(false)
      return
    }

    toast.success('Account created! Welcome to StreakOS!')
    navigate('/')
  }

  const passwordStrength = () => {
    const { password } = formData
    if (password.length === 0) return null
    if (password.length < 6) return { label: 'Too short', color: 'text-danger-light' }
    if (password.length < 8) return { label: 'Weak', color: 'text-warning-light' }
    if (password.length < 12) return { label: 'Good', color: 'text-success-light' }
    return { label: 'Strong', color: 'text-success-light' }
  }

  const strength = passwordStrength()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Create your account
        </h1>
        <p className="text-dark-muted">
          Start building streaks and leveling up
        </p>
      </div>

      {isLocalMode && (
        <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <p className="text-sm text-primary-300">
            Running in demo mode. Data is stored locally in your browser.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className={errors.email ? 'input-error' : 'input'}
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger-light">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="label">Username</label>
          <input
            type="text"
            className={errors.username ? 'input-error' : 'input'}
            placeholder="your_username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
            required
          />
          {errors.username ? (
            <p className="mt-1 text-sm text-danger-light">{errors.username}</p>
          ) : (
            <p className="mt-1 text-xs text-dark-muted">
              3-20 characters, letters, numbers, underscore
            </p>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={errors.password ? 'input-error pr-12' : 'input pr-12'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between">
            {errors.password ? (
              <p className="text-sm text-danger-light">{errors.password}</p>
            ) : strength ? (
              <p className={`text-sm ${strength.color}`}>{strength.label}</p>
            ) : (
              <p className="text-xs text-dark-muted">At least 6 characters</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-dark-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-dark-muted">
        By signing up, you agree to build awesome habits.
      </p>
    </motion.div>
  )
}
