import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Clock, Zap, ChevronRight, Play, CheckCircle2, Shield,
  BookOpen, Dumbbell, Languages, Palette, Target, Star
} from 'lucide-react'
import { cn, getStatusInfo, formatMinutes, DIFFICULTY_LABELS } from '../../lib/utils'

const INTENT_ICONS = {
  study: BookOpen,
  fitness: Dumbbell,
  language: Languages,
  creative: Palette,
  skill: Target,
  general: Star
}

const INTENT_COLORS = {
  study: 'from-blue-500 to-blue-600',
  fitness: 'from-green-500 to-green-600',
  language: 'from-purple-500 to-purple-600',
  creative: 'from-pink-500 to-pink-600',
  skill: 'from-orange-500 to-orange-600',
  general: 'from-gray-500 to-gray-600'
}

export default function QuestCard({ quest, track, onUpdate, compact = false }) {
  const navigate = useNavigate()
  const statusInfo = getStatusInfo(quest.status)
  const IntentIcon = INTENT_ICONS[track?.intent] || Star
  const gradientColor = INTENT_COLORS[track?.intent] || INTENT_COLORS.general

  const isCompleted = quest.status === 'completed' || quest.status === 'mvp_completed'
  const isInProgress = quest.status === 'in_progress'

  const handleClick = () => {
    navigate(`/quest/${quest.id}`)
  }

  if (compact) {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className="card cursor-pointer opacity-75"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
            gradientColor
          )}>
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate">{quest.title}</h3>
            <div className="flex items-center gap-2 text-sm text-dark-muted">
              <span className="text-success-light">+{quest.reward_xp} XP</span>
              {quest.status === 'mvp_completed' && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <Shield className="w-3 h-3" />
                  MVP
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "card-hover cursor-pointer overflow-hidden",
        isInProgress && "border-primary-500/50 shadow-glow-primary"
      )}
    >
      {/* Progress indicator for in-progress */}
      {isInProgress && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500/20">
          <motion.div
            className="h-full bg-primary-500"
            initial={{ width: '0%' }}
            animate={{ width: '50%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Intent icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
          gradientColor
        )}>
          <IntentIcon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-dark-muted mb-0.5">{track?.name}</p>
              <h3 className="font-semibold text-white leading-tight">{quest.title}</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-dark-muted shrink-0" />
          </div>

          <p className="text-sm text-dark-muted mt-1 line-clamp-2">
            {quest.instructions}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-sm text-dark-muted">
              <Clock className="w-4 h-4" />
              {formatMinutes(quest.estimated_minutes)}
            </span>
            <span className="flex items-center gap-1 text-sm text-primary-400">
              <Zap className="w-4 h-4" />
              +{quest.reward_xp} XP
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              quest.difficulty <= 2 ? "bg-green-500/20 text-green-400" :
              quest.difficulty <= 3 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-orange-500/20 text-orange-400"
            )}>
              {DIFFICULTY_LABELS[quest.difficulty] || 'Moderate'}
            </span>
          </div>

          {/* Action button */}
          <div className="mt-3">
            {isInProgress ? (
              <button className="btn-primary w-full py-2 text-sm">
                <Play className="w-4 h-4" />
                Continue Quest
              </button>
            ) : (
              <button className="btn-secondary w-full py-2 text-sm">
                <Play className="w-4 h-4" />
                Start Quest
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
