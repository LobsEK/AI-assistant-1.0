'use client'
import { useState } from 'react'
import { Agent } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { sk } from 'date-fns/locale'

const AGENT_ICONS: Record<string, string> = {
  gmail:  '📧',
  news:   '📡',
  custom: '🤖',
}

interface Props {
  agents:       Agent[]
  activeId:     string
  onSelect:     (id: string) => void
  onAgentAdded: (a: Agent) => void
  loading:      boolean
}

export function Sidebar({ agents, activeId, onSelect, onAgentAdded, loading }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding,  setAdding]  = useState(false)

  async function addAgent() {
    if (!newName.trim()) return
    setAdding(true)
    const res  = await fetch('/api/agents', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: newName, description: newDesc }),
    })
    const data = await res.json()
    onAgentAdded(data.agent)
    setNewName(''); setNewDesc(''); setShowAdd(false); setAdding(false)
  }

  return (
    <aside className="w-[260px] flex-shrink-0 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-dark-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <span className="text-white font-bold text-base tracking-tight">Agent Hub</span>
        </div>
        <p className="text-xs text-slate-muted">Tvoji osobní AI agenti</p>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <p className="text-[10px] font-semibold text-slate-muted uppercase tracking-widest px-2 mb-2">Agenti</p>

        {loading ? (
          <div className="space-y-2 px-2">
            {[1,2].map(i => (
              <div key={i} className="h-14 rounded-lg bg-dark-800 animate-pulse" />
            ))}
          </div>
        ) : (
          agents.map(agent => (
            <AgentItem
              key={agent.id}
              agent={agent}
              isActive={agent.id === activeId}
              onClick={() => onSelect(agent.id)}
            />
          ))
        )}

        {/* Add agent button */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 text-xs text-slate-muted hover:text-white rounded-lg hover:bg-dark-750 transition-all group"
          >
            <span className="w-5 h-5 rounded-md bg-dark-700 group-hover:bg-dark-600 flex items-center justify-center text-xs transition-all">+</span>
            Pridať agenta
          </button>
        ) : (
          <div className="mt-2 p-3 rounded-xl bg-dark-800 border border-dark-600 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Názov agenta..."
              className="w-full bg-dark-750 border border-dark-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-muted outline-none focus:border-neon-blue/50"
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Náplň práce (voliteľné)..."
              className="w-full bg-dark-750 border border-dark-600 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-muted outline-none focus:border-neon-blue/50"
            />
            <div className="flex gap-2">
              <button
                onClick={addAgent}
                disabled={adding || !newName.trim()}
                className="flex-1 py-1.5 bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              >
                {adding ? '...' : 'Pridať'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewName(''); setNewDesc('') }}
                className="flex-1 py-1.5 bg-dark-700 hover:bg-dark-600 text-slate-text rounded-lg text-xs transition-all"
              >
                Zrušiť
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-dark-700">
        <p className="text-[10px] text-slate-muted">
          {agents.filter(a => a.isActive).length} / {agents.length} agentov aktívnych
        </p>
      </div>
    </aside>
  )
}

function AgentItem({ agent, isActive, onClick }: { agent: Agent; isActive: boolean; onClick: () => void }) {
  const icon      = AGENT_ICONS[agent.type] || '🤖'
  const isOnline  = agent.isActive && !!agent.lastSync
  const lastSync  = agent.lastSync
    ? formatDistanceToNow(new Date(agent.lastSync), { addSuffix: true, locale: sk })
    : 'nikdy'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all group
        ${isActive
          ? 'bg-dark-750 border border-dark-600 border-neon-blue/20'
          : 'hover:bg-dark-800 border border-transparent'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0
          ${isActive ? 'bg-dark-700' : 'bg-dark-800 group-hover:bg-dark-700'}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{agent.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isOnline ? 'bg-neon-green status-dot-online' : 'bg-red-500 status-dot-offline'
            }`} />
          </div>
          <p className="text-[10px] text-slate-muted truncate mt-0.5">{agent.description}</p>
        </div>
      </div>

      {isActive && (
        <div className="mt-2 pt-2 border-t border-dark-600 flex items-center justify-between">
          <span className="text-[10px] text-slate-muted">Sync: {lastSync}</span>
          <span className={`text-[10px] font-medium ${isOnline ? 'text-neon-green' : 'text-red-400'}`}>
            {isOnline ? '● Online' : '● Offline'}
          </span>
        </div>
      )}
    </button>
  )
}
