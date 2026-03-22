'use client'
import { useState, useEffect, useCallback } from 'react'
import { NewsItem, NewsCategory } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { sk } from 'date-fns/locale'

const CATEGORIES: { key: NewsCategory; label: string; icon: string }[] = [
  { key: 'all',         label: 'Všetko',       icon: '🌐' },
  { key: 'text-models', label: 'Text modely',   icon: '🧠' },
  { key: 'speech',      label: 'Speech / Audio', icon: '🎙️' },
  { key: 'vision',      label: 'Vision',         icon: '👁️' },
  { key: 'other',       label: 'Ostatné',        icon: '📦' },
]

const COMPANY_ORDER = ['Anthropic', 'OpenAI', 'Google DeepMind', 'Meta AI', 'Mistral AI']

export function NewsView() {
  const [items,    setItems]    = useState<NewsItem[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [category, setCategory] = useState<NewsCategory>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async (force = false) => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`/api/news${force ? '?refresh=1' : ''}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setItems(data.items || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = items.filter(i => category === 'all' || i.category === category)

  // Group by company
  const grouped = COMPANY_ORDER.reduce((acc, company) => {
    const co = filtered.filter(i => i.company === company)
    if (co.length) acc[company] = co
    return acc
  }, {} as Record<string, NewsItem[]>)

  const otherCompanies = filtered.filter(i => !COMPANY_ORDER.includes(i.company))
  if (otherCompanies.length) grouped['Ostatné'] = otherCompanies

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📡</span> AI News Agent
          </h1>
          <p className="text-xs text-slate-muted mt-0.5">Novinky z AI sveta s analýzou</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-750 border border-dark-600 rounded-xl text-xs text-slate-text hover:text-white transition-all disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          Načítať nové
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
              ${category === cat.key
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                : 'bg-dark-800 text-slate-muted hover:text-white border border-dark-700'}`}
          >
            <span className="text-sm">{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-dark-800 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-muted">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm">Žiadne novinky v tejto kategórii</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([company, companyItems]) => (
            <CompanySection
              key={company}
              company={company}
              items={companyItems}
              expanded={expanded}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CompanySection({ company, items, expanded, onToggle }: {
  company: string
  items: NewsItem[]
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const logo = items[0]?.logoEmoji || '🤖'

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-base">{logo}</div>
        <h2 className="text-sm font-bold text-white">{company}</h2>
        <span className="text-[10px] text-slate-muted bg-dark-800 border border-dark-700 rounded-full px-2 py-0.5">{items.length} updatov</span>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <NewsCard key={item.id} item={item} expanded={expanded.has(item.id)} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
    </div>
  )
}

function NewsCard({ item, expanded, onToggle }: { item: NewsItem; expanded: boolean; onToggle: () => void }) {
  const timeAgo = formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: sk })
  const catColors: Record<string, string> = {
    'text-models': 'bg-neon-violet/15 text-purple-400',
    'speech':      'bg-cyan-500/15 text-cyan-400',
    'vision':      'bg-emerald-500/15 text-emerald-400',
    'other':       'bg-dark-700 text-slate-muted',
  }

  return (
    <div className="bg-dark-850 border border-dark-700 hover:border-dark-600 rounded-xl overflow-hidden transition-all">
      {/* Card header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {item.model && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neon-blue/15 text-neon-blue">{item.model}</span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${catColors[item.category] || catColors.other}`}>
                {CATEGORIES.find(c => c.key === item.category)?.label || item.category}
              </span>
              <span className="text-[10px] text-slate-muted">{timeAgo}</span>
            </div>
            <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
          </div>
        </div>

        {/* Bullets */}
        {item.bullets.length > 0 && (
          <ul className="mt-3 space-y-1">
            {item.bullets.slice(0, expanded ? undefined : 3).map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-text">
                <span className="text-neon-cyan mt-0.5 flex-shrink-0">▸</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Toggle */}
        <button
          onClick={onToggle}
          className="mt-3 text-[11px] text-slate-muted hover:text-neon-blue transition-all flex items-center gap-1"
        >
          {expanded ? '▲ Skryť analýzu' : '▼ Zobraziť AI analýzu'}
        </button>
      </div>

      {/* AI Analysis */}
      {expanded && item.aiAnalysis && (
        <div className="border-t border-dark-700 bg-dark-900/60 p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold text-neon-cyan uppercase tracking-wider mb-2">⚡ Realita (bez marketingu)</p>
            <p className="text-xs text-slate-text leading-relaxed">{item.aiAnalysis.reality}</p>
          </div>
          {item.aiAnalysis.howToUse.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-neon-violet uppercase tracking-wider mb-2">🔧 Ako to zapracovať</p>
              <ul className="space-y-1.5">
                {item.aiAnalysis.howToUse.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-text">
                    <span className="text-neon-violet mt-0.5 flex-shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <a
            href={item.sourceUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-slate-muted hover:text-white transition-all"
          >
            Originálny článok ↗
          </a>
        </div>
      )}
    </div>
  )
}
