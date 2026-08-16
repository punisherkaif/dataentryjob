'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'

interface LogoutButtonProps {
  className?: string
  variant?: 'full' | 'icon'
}

export default function LogoutButton({ className = '', variant = 'full' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logoutAction()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50 ${className}`}
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
      {variant === 'full' && (
        <span>{loading ? 'Logging out...' : 'Sign Out'}</span>
      )}
    </button>
  )
}
