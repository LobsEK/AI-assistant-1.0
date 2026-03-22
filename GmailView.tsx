'use client'
import { useState, useEffect, useCallback } from 'react'
import { Email } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { sk } from 'date-fns/locale'

const DISMISSED_KEY = 'agent_dismissed_v2'
function getDismissed(): Record<string, { reason: string; at: string }> {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}') } catch { return {} }
}
function saveDismissed(obj: Record<string, any>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(obj))
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0,2).toUpperCase()
}

export function GmailView() {
  const [emails,     setEmails]     = useState<Email[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [dismissed,  setDismissed]  = useState<Record<string, any>>({})
  const [dismissId,  setDismissId]  = useState<string | null>(null)
  const [dismissReason, setReason]  = useState('')

  useEffect(() => { setDismissed(getDismissed()) }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/gmail')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEmails(data.emails || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function dismiss(id: string) {
    const d = { ...getDismissed(), [id]: { reason: dismissReason, at: new Date().toISOString() } }
    saveDismissed(d)
    setDismissed(d)
    setDismissId(null); setReason('')
  }
  function undoDismiss(id: string) {
    const d = getDismissed()
    delete d[id]
    saveDismissed(d)
    setDismissed({ ...d })
  }

  const pending = emails.filter(e => daysSince(e.date) >= 2)
  const urgent  = pending.filter(e => daysSince(e.date) >= 3 && !dismissed[e.id])
  const warning = pending.filter(e => daysSince(e.date) >= 2 && daysSince(e.date) < 3 && !dismissed[e.id])
  const dismissed_list = pending.filter(e => dismissed[e.id])

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📧</span> Gmail Agent
          </h1>
          <p className="text-xs text-slate-muted mt-0.5">Emaily čakajúce na odpoveď</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-750 border border-dark-600 rounded-xl text-xs text-slate-text hover:text-white transition-all disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          Obnoviť
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Urgentné (3+ dni)" value={urgent.length} color="text-red-400" />
        <StatCard label="Čakajúce (2+ dni)"  value={warning.length} color="text-amber-400" />
        <StatCard label="Bez odpovede (ign.)" value={Object.keys(dismissed).length} color="text-emerald-400" />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-dark-800 animate-pulse" />)}
        </div>
      ) : urgent.length === 0 && warning.length === 0 ? (
        <div className="text-center py-16 text-slate-muted">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">Všetky emaily majú odpoveď!</p>
        </div>
      ) : (
        <>
          {urgent.length > 0 && (
            <Section label="Urgentné" badge={`${urgent.length} · 3+ dní`} badgeColor="bg-red-500/15 text-red-400">
              {urgent.sort((a,b) => daysSince(b.date)-daysSince(a.date)).map(e => (
                <EmailCard key={e.id} email={e} level="urgent" dismissed={dismissed}
                  onDismiss={() => setDismissId(e.id)} onUndo={() => undoDismiss(e.id)}
                  showDismissForm={dismissId === e.id} reason={dismissReason}
                  onReasonChange={setReason} onConfirmDismiss={() => dismiss(e.id)}
                  onCancelDismiss={() => setDismissId(null)} />
              ))}
            </Section>
          )}
          {warning.length > 0 && (
            <Section label="Čakajúce" badge={`${warning.length} · 2+ dní`} badgeColor="bg-amber-500/15 text-amber-400">
              {warning.sort((a,b) => daysSince(b.date)-daysSince(a.date)).map(e => (
                <EmailCard key={e.id} email={e} level="warning" dismissed={dismissed}
                  onDismiss={() => setDismissId(e.id)} onUndo={() => undoDismiss(e.id)}
                  showDismissForm={dismissId === e.id} reason={dismissReason}
                  onReasonChange={setReason} onConfirmDismiss={() => dismiss(e.id)}
                  onCancelDismiss={() => setDismissId(null)} />
              ))}
            </Section>
          )}
          {dismissed_list.length > 0 && (
            <Section label="Označené – bez odpovede" badge={`${dismissed_list.length}`} badgeColor="bg-dark-700 text-slate-muted">
              {dismissed_list.map(e => (
                <EmailCard key={e.id} email={e} level="dismissed" dismissed={dismissed}
                  onDismiss={() => {}} onUndo={() => undoDismiss(e.id)}
                  showDismissForm={false} reason="" onReasonChange={() => {}}
                  onConfirmDismiss={() => {}} onCancelDismiss={() => {}} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-dark-850 border border-dark-700 rounded-xl p-4">
      <p className="text-[10px] text-slate-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Section({ label, badge, badgeColor, children }: any) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-semibold text-slate-muted uppercase tracking-widest">{label}</p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function EmailCard({ email, level, dismissed, onDismiss, onUndo, showDismissForm, reason, onReasonChange, onConfirmDismiss, onCancelDismiss }: any) {
  const days    = daysSince(email.date)
  const isDism  = !!dismissed[email.id]
  const reason_ = dismissed[email.id]?.reason

  const colors: Record<string,string> = {
    urgent:    'bg-red-500/15 text-red-300',
    warning:   'bg-amber-500/15 text-amber-300',
    dismissed: 'bg-dark-700 text-slate-muted',
  }

  return (
    <div className={`bg-dark-850 border rounded-xl p-4 transition-all ${isDism ? 'opacity-50 border-dark-700' : 'border-dark-700 hover:border-dark-600'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${colors[level]}`}>
          {initials(email.from_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-white truncate">{email.from_name}</span>
            {!isDism && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${colors[level]}`}>
                {days} {days === 1 ? 'deň' : 'dní'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-text truncate mt-0.5">{email.subject || '(bez predmetu)'}</p>
          <p className="text-[11px] text-slate-muted mt-1">{email.from_email}{reason_ ? ` · ${reason_}` : ''}</p>

          {!isDism && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg text-xs font-medium transition-all"
              >
                Odpovedať ↗
              </a>
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-dark-750 hover:bg-dark-700 text-slate-text rounded-lg text-xs transition-all"
              >
                Nepotrebujem odpovedať
              </button>
            </div>
          )}
          {isDism && (
            <button onClick={onUndo} className="mt-2 text-[11px] text-slate-muted hover:text-white transition-all">
              ← Vrátiť späť
            </button>
          )}

          {showDismissForm && (
            <div className="mt-3 space-y-2">
              <input
                autoFocus
                value={reason}
                onChange={e => onReasonChange(e.target.value)}
                placeholder="Dôvod (voliteľné)..."
                className="w-full bg-dark-750 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-muted outline-none focus:border-neon-blue/40"
              />
              <div className="flex gap-2">
                <button onClick={onConfirmDismiss} className="px-3 py-1.5 bg-neon-blue/20 text-neon-blue rounded-lg text-xs font-medium">Potvrdiť</button>
                <button onClick={onCancelDismiss} className="px-3 py-1.5 bg-dark-750 text-slate-text rounded-lg text-xs">Zrušiť</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
