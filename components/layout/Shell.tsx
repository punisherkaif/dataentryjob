'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck,
  UserCheck,
  FolderPlus,
  History,
  ShieldAlert,
  User,
  CheckCircle2,
} from 'lucide-react'
import LogoutButton from '@/components/ui/LogoutButton'
import { UserRole } from '@/types/database.types'

interface ShellProps {
  children: React.ReactNode
  role: UserRole
  userName?: string
  userEmail?: string
}

export default function Shell({ children, role, userName = 'User', userEmail = '' }: ShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const adminNav = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Registrations', href: '/admin/registrations', icon: UserCheck },
    { name: 'Manage Tasks', href: '/admin/tasks', icon: FolderPlus },
    { name: 'Review Submissions', href: '/admin/submissions', icon: FileCheck },
    { name: 'Activity Log', href: '/admin/logs', icon: History },
  ]

  const userNav = [
    { name: 'My Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Tasks', href: '/user/tasks', icon: FolderPlus },
    { name: 'My Submissions', href: '/user/submissions', icon: FileCheck },
  ]

  const navigation = role === 'ADMIN' ? adminNav : userNav

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* HEADER */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-md lg:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo / Brand */}
          <Link href={role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 font-bold text-white shadow-lg shadow-indigo-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-100 text-lg">TypeCraft</span>
              <span className="ml-2 hidden text-xs font-semibold uppercase tracking-wider text-indigo-400 sm:inline-block">
                Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right / User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-indigo-400 ring-1 ring-slate-700">
              <User className="h-4 w-4" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-medium text-slate-200">{userName}</p>
              <p className="text-[11px] text-slate-400">{userEmail}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              role === 'ADMIN'
                ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
            }`}
          >
            {role}
          </span>

          <div className="hidden sm:block border-l border-slate-800 pl-3">
            <LogoutButton variant="icon" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* DESKTOP SIDEBAR (1200px+) */}
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/50 p-4 lg:flex">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Navigation
          </div>
          <nav className="mt-2 space-y-1.5 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-slate-800 pt-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/90 p-3">
              <p className="text-xs font-semibold text-slate-300">System Status</p>
              <p className="mt-1 text-[11px] text-slate-400">All services operational</p>
            </div>
            <div className="mt-3">
              <LogoutButton className="w-full justify-center" variant="full" />
            </div>
          </div>
        </aside>

        {/* MOBILE SLIDE-OVER DRAWER (320px+) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Content Drawer */}
            <div className="relative flex w-full max-w-xs flex-col border-r border-slate-800 bg-slate-900 p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-base font-bold text-slate-100">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile User Info */}
              <div className="my-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-200">{userName}</p>
                <p className="text-xs text-slate-400">{userEmail}</p>
                <span
                  className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                    role === 'ADMIN'
                      ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                  }`}
                >
                  {role}
                </span>
              </div>

              <nav className="space-y-1 flex-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-slate-800">
                <LogoutButton className="w-full justify-center" variant="full" />
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
