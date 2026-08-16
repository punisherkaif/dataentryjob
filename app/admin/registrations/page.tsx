'use client'

import { useState, useEffect } from 'react'
import Shell from '@/components/layout/Shell'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  getRegistrationsAction,
  approveRegistrationAction,
  rejectRegistrationAction,
} from '@/app/actions/admin-registration'
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  Filter,
  X,
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
  User,
  Mail,
  Phone,
  AtSign,
} from 'lucide-react'

interface RegistrationItem {
  id: string
  user_id: string
  transaction_id: string
  payment_amount: number
  payment_screenshot_url: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
  users: {
    name: string
    email: string
    phone: string
    username: string
    status: string
  }
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedReg, setSelectedReg] = useState<RegistrationItem | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadRegistrations = async (filter: string) => {
    setLoading(true)
    const res = await getRegistrationsAction(filter)
    setRegistrations(res.registrations as unknown as RegistrationItem[])
    setLoading(false)
  }

  useEffect(() => {
    loadRegistrations(statusFilter)
  }, [statusFilter])

  const handleApprove = async (reg: RegistrationItem) => {
    setActionLoading(true)
    setFeedbackMsg(null)
    const res = await approveRegistrationAction(reg.id, reg.user_id)
    setActionLoading(false)
    if (res.error) {
      setFeedbackMsg({ type: 'error', text: res.error })
    } else {
      setFeedbackMsg({ type: 'success', text: `Registration approved for ${reg.users.name}!` })
      setSelectedReg(null)
      loadRegistrations(statusFilter)
    }
  }

  const handleReject = async (reg: RegistrationItem) => {
    setActionLoading(true)
    setFeedbackMsg(null)
    const res = await rejectRegistrationAction(reg.id, reg.user_id, rejectNote)
    setActionLoading(false)
    if (res.error) {
      setFeedbackMsg({ type: 'error', text: res.error })
    } else {
      setFeedbackMsg({ type: 'success', text: `Registration rejected for ${reg.users.name}.` })
      setSelectedReg(null)
      setRejectNote('')
      loadRegistrations(statusFilter)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 ring-1 ring-rose-500/30">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            Pending Review
          </span>
        )
    }
  }

  return (
    <Shell role="ADMIN">
      <div className="space-y-6">
        {/* Header Title & Filter Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <UserCheck className="h-7 w-7 text-indigo-400" />
              Registration Approval Requests
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Review worker registrations, verify UPI transactions, and approve or reject access.
            </p>
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 p-1 backdrop-blur-md self-start sm:self-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`rounded-xl border p-4 text-sm flex items-center justify-between ${
              feedbackMsg.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            <Clock className="h-8 w-8 animate-spin mx-auto text-indigo-400 mb-2" />
            <span>Loading registration requests...</span>
          </div>
        ) : registrations.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <UserCheck className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No Registrations Found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {statusFilter === 'PENDING'
                ? 'There are currently no pending registration requests awaiting approval.'
                : `No registrations matching the filter "${statusFilter}".`}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (Hidden on Mobile < 768px) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {registrations.map((reg) => (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedReg(reg)}
                      className="cursor-pointer transition-colors hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100">{reg.users?.name || 'User'}</div>
                        <div className="text-xs text-slate-400">{reg.users?.email}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-400">
                        @{reg.users?.username}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-200">
                        {reg.transaction_id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">
                        ₹{reg.payment_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(reg.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReg(reg)
                          }}
                          className="rounded-lg bg-indigo-600/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          View & Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD LIST VIEW (Visible on Mobile < 768px) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  onClick={() => setSelectedReg(reg)}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-3 cursor-pointer active:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-100">{reg.users?.name}</h3>
                      <p className="text-xs text-indigo-400 font-mono">@{reg.users?.username}</p>
                    </div>
                    {getStatusBadge(reg.status)}
                  </div>

                  <div className="rounded-xl bg-slate-950/70 p-3 text-xs space-y-1.5 border border-slate-800/80 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">TxID:</span>
                      <span className="text-slate-200 font-semibold">{reg.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="text-emerald-400 font-bold">₹{reg.payment_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Submitted: {new Date(reg.created_at).toLocaleDateString()}</span>
                    <span className="font-semibold text-indigo-400">Tap to Review →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REGISTRATION DETAIL MODAL / DRAWER */}
        {selectedReg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedReg(null)}
            />

            {/* Modal Body */}
            <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                  Registration Review
                </h2>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between rounded-xl bg-slate-950/60 p-4 border border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Current Status</p>
                  <p className="mt-0.5">{getStatusBadge(selectedReg.status)}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Submitted On</p>
                  <p className="font-mono text-slate-200 mt-0.5">
                    {new Date(selectedReg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-indigo-400" />
                    Full Name
                  </span>
                  <p className="text-sm font-semibold text-slate-100">{selectedReg.users?.name}</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <AtSign className="h-3.5 w-3.5 text-indigo-400" />
                    Username
                  </span>
                  <p className="text-sm font-mono font-semibold text-indigo-400">
                    @{selectedReg.users?.username}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-indigo-400" />
                    Email Address
                  </span>
                  <p className="text-sm font-medium text-slate-200">{selectedReg.users?.email}</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                    Mobile Phone
                  </span>
                  <p className="text-sm font-mono text-slate-200">{selectedReg.users?.phone}</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  UPI Payment Verification
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block">Transaction ID / UTR</span>
                    <span className="text-slate-100 font-bold text-sm">
                      {selectedReg.transaction_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Amount Paid</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ₹{selectedReg.payment_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Screenshot Preview */}
                {selectedReg.payment_screenshot_url ? (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400 block mb-2">Payment Screenshot</span>
                    <a
                      href={selectedReg.payment_screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full Screenshot Image
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-2">
                    No payment screenshot image uploaded. Verify using Transaction ID.
                  </p>
                )}
              </div>

              {/* Action Buttons for PENDING */}
              {selectedReg.status === 'PENDING' ? (
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedReg)}
                      disabled={actionLoading}
                      className="flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {actionLoading ? 'Processing...' : 'Approve Registration'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Reason for rejection (optional)"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      onClick={() => handleReject(selectedReg)}
                      disabled={actionLoading}
                      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Registration
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
                  Reviewed on{' '}
                  {selectedReg.reviewed_at
                    ? new Date(selectedReg.reviewed_at).toLocaleString()
                    : 'N/A'}
                  {selectedReg.admin_note && (
                    <p className="mt-1 text-rose-400 italic">Note: {selectedReg.admin_note}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
