'use client'
import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Sidebar }     from '@/components/Sidebar'
import { GmailView }   from '@/components/gmail/GmailView'
import { NewsView }    from '@/components/news/NewsView'
import { Agent }       from '@/types'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeAgent, setActiveAgent] = useState<string>('gmail-agent')
  const [agents, setAgents]           = useState<Agent[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(d => { setAgents(d.agents || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Poll agent status every 30s
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/agents')
        .then(r => r.json())
        .then(d => setAgents(d.agents || []))
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
        <div className="text-slate-text text-sm animate-pulse">Načítavam...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-dark-950 gap-6">
        <div className="text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold text-white mb-2">Agent Dashboard</h1>
          <p className="text-slate-text text-sm">Pripoj sa cez Google účet pre plný prístup</p>
        </div>
        <button
          onClick={() => signIn('google')}
          className="flex items-center gap-3 px-6 py-3 bg-dark-800 hover:bg-dark-750 border border-dark-600 text-white rounded-xl text-sm font-medium transition-all hover:border-neon-blue/40"
        >
          <span>🔑</span> Prihlásiť sa cez Google
        </button>
      </div>
    )
  }

  const currentAgent = agents.find(a => a.id === activeAgent)

  return (
    <div className="h-screen flex overflow-hidden bg-dark-950">
      <Sidebar
        agents={agents}
        activeId={activeAgent}
        onSelect={setActiveAgent}
        onAgentAdded={(a) => setAgents(prev => [...prev, a])}
        loading={loading}
      />

      <main className="flex-1 overflow-y-auto">
        {currentAgent?.type === 'gmail' && <GmailView />}
        {currentAgent?.type === 'news'  && <NewsView  />}
        {(!currentAgent || currentAgent.type === 'custom') && (
          <div className="h-full flex items-center justify-center text-slate-muted">
            <div className="text-center">
              <div className="text-3xl mb-3">🤖</div>
              <p className="text-sm">Vyber agenta z ľavého panela</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
