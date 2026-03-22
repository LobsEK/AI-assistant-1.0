import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const parser = new Parser()

const AI_SOURCES = [
  {
    company:   'Anthropic',
    logo:      '🟠',
    feedUrl:   'https://www.anthropic.com/rss.xml',
    category:  'text-models',
  },
  {
    company:   'OpenAI',
    logo:      '⚫',
    feedUrl:   'https://openai.com/blog/rss.xml',
    category:  'text-models',
  },
  {
    company:   'Google DeepMind',
    logo:      '🔵',
    feedUrl:   'https://deepmind.google/blog/rss/',
    category:  'text-models',
  },
  {
    company:   'Meta AI',
    logo:      '🔷',
    feedUrl:   'https://ai.meta.com/blog/rss/',
    category:  'text-models',
  },
  {
    company:   'Mistral AI',
    logo:      '🌊',
    feedUrl:   'https://mistral.ai/news/rss.xml',
    category:  'text-models',
  },
]

function categorize(title: string, summary: string): string {
  const text = (title + ' ' + summary).toLowerCase()
  if (text.match(/speech|audio|voice|whisper|tts|stt/))   return 'speech'
  if (text.match(/vision|image|video|multimodal|visual/)) return 'vision'
  if (text.match(/model|gpt|claude|gemini|llm|language/)) return 'text-models'
  return 'other'
}

async function generateAIAnalysis(title: string, summary: string): Promise<{
  reality: string
  howToUse: string[]
  bullets: string[]
} | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analyze this AI news item and return ONLY valid JSON (no markdown):
Title: ${title}
Summary: ${summary}

Return: {"bullets":["fact1","fact2","fact3"],"reality":"1-2 sentences what this means in practice without marketing","howToUse":["tip1","tip2"]}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const forceRefresh = req.nextUrl.searchParams.get('refresh') === '1'

  // Return cached if recent (< 1 hour)
  if (!forceRefresh) {
    const recent = await prisma.newsItem.findMany({
      where: { fetchedAt: { gte: new Date(Date.now() - 3600_000) } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    if (recent.length > 0) {
      return NextResponse.json({ items: recent.map(deserialize) })
    }
  }

  const allItems: any[] = []

  for (const source of AI_SOURCES) {
    try {
      const feed = await parser.parseURL(source.feedUrl)

      for (const item of feed.items.slice(0, 5)) {
        const title   = item.title   || ''
        const summary = item.contentSnippet || item.content || ''
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()

        // Skip if older than 30 days
        if (Date.now() - pubDate.getTime() > 30 * 24 * 3600_000) continue

        const category = categorize(title, summary)
        const analysis = await generateAIAnalysis(title, summary)

        const newsItem = {
          company:    source.company,
          model:      extractModelName(title),
          title,
          summary:    summary.slice(0, 500),
          bullets:    JSON.stringify(analysis?.bullets   || [summary.slice(0, 120)]),
          aiAnalysis: analysis ? JSON.stringify({ reality: analysis.reality, howToUse: analysis.howToUse }) : null,
          category,
          sourceUrl:  item.link || '',
          logoEmoji:  source.logo,
          publishedAt: pubDate,
        }

        await prisma.newsItem.upsert({
          where:  { sourceUrl: newsItem.sourceUrl || `${source.company}-${title}` },
          update: newsItem,
          create: newsItem,
        }).catch(() => {})

        allItems.push(newsItem)
      }
    } catch (err) {
      console.error(`Failed to fetch ${source.company}:`, err)
    }
  }

  await prisma.agent.updateMany({
    where: { type: 'news' },
    data:  { lastSync: new Date() },
  }).catch(() => {})

  const all = await prisma.newsItem.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 60,
  })

  return NextResponse.json({ items: all.map(deserialize) })
}

function extractModelName(title: string): string | null {
  const match = title.match(/\b(GPT-[\d.]+|Claude[\s\d.]*[\w]*|Gemini[\s\w]*|Llama[\s\d]*|Mistral[\s\w]*|Grok[\s\d]*)\b/i)
  return match?.[1] || null
}

function deserialize(item: any) {
  return {
    ...item,
    bullets:    JSON.parse(item.bullets || '[]'),
    aiAnalysis: item.aiAnalysis ? JSON.parse(item.aiAnalysis) : null,
  }
}
