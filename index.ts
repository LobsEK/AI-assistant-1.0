export interface Agent {
  id:          string
  name:        string
  type:        'gmail' | 'news' | 'custom'
  description: string
  isActive:    boolean
  lastSync:    string | null
  uptime:      number
  logs:        AgentLog[]
}

export interface AgentLog {
  id:        string
  agentId:   string
  status:    'success' | 'error' | 'warning'
  message:   string
  createdAt: string
}

export interface Email {
  id:         string
  from_name:  string
  from_email: string
  subject:    string
  date:       string
  snippet:    string
  threadId:   string
  labelIds:   string[]
}

export interface NewsItem {
  id:          string
  company:     string
  model:       string | null
  title:       string
  summary:     string
  bullets:     string[]
  aiAnalysis:  { reality: string; howToUse: string[] } | null
  category:    'text-models' | 'speech' | 'vision' | 'other'
  sourceUrl:   string
  logoEmoji:   string | null
  publishedAt: string
  fetchedAt:   string
}

export type NewsCategory = 'all' | 'text-models' | 'speech' | 'vision' | 'other'

declare module 'next-auth' {
  interface Session {
    accessToken:  string
    refreshToken: string
  }
}
