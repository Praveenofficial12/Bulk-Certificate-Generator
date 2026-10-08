'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { type LucideIcon, Plus, Inbox, FolderX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MotionButton } from './motion-button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  variant?: 'default' | 'compact'
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-center',
        variant === 'default' ? 'px-6 py-16' : 'px-4 py-8',
        className
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary ring-1 ring-primary/20">
          <Icon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <MotionButton onClick={onAction} variant="primary" size="md">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </MotionButton>
        </div>
      )}
    </motion.div>
  )
}

export function TableEmpty({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99} className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <FolderX className="h-10 w-10 text-muted-foreground/60" />
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        </div>
      </td>
    </tr>
  )
}

export { AnimatePresence }
