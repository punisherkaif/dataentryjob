import React from 'react'
import {
  Clock,
  PlayCircle,
  UploadCloud,
  Eye,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  ShieldAlert,
} from 'lucide-react'

export type AnyStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PASSED'
  | 'FAILED'
  | 'ACTIVE'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | string

interface StatusBadgeProps {
  status: AnyStatus
  className?: string
  showIcon?: boolean
}

const statusConfigMap: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  // Yellow / Amber: Pending
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/30 border-amber-500/20',
    icon: Clock,
  },

  // Blue: In Progress
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-blue-500/10 text-blue-400 ring-blue-500/30 border-blue-500/20',
    icon: PlayCircle,
  },

  // Purple: Submitted / Under Review
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-purple-500/10 text-purple-400 ring-purple-500/30 border-purple-500/20',
    icon: UploadCloud,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-purple-500/10 text-purple-400 ring-purple-500/30 border-purple-500/20',
    icon: Eye,
  },

  // Green: Passed / Active / Approved
  PASSED: {
    label: 'Passed',
    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 border-emerald-500/20',
    icon: CheckCircle2,
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 border-emerald-500/20',
    icon: UserCheck,
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30 border-emerald-500/20',
    icon: CheckCircle2,
  },

  // Red: Failed / Rejected / Suspended
  FAILED: {
    label: 'Failed',
    className: 'bg-rose-500/10 text-rose-400 ring-rose-500/30 border-rose-500/20',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-500/10 text-rose-400 ring-rose-500/30 border-rose-500/20',
    icon: UserX,
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'bg-rose-500/10 text-rose-400 ring-rose-500/30 border-rose-500/20',
    icon: ShieldAlert,
  },
}

export default function StatusBadge({ status, className = '', showIcon = true }: StatusBadgeProps) {
  const normalized = (status || 'PENDING').toUpperCase()
  const cfg = statusConfigMap[normalized] || {
    label: status,
    className: 'bg-slate-500/10 text-slate-400 ring-slate-500/30 border-slate-500/20',
    icon: Clock,
  }
  const Icon = cfg.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 border ${cfg.className} ${className}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {cfg.label}
    </span>
  )
}
