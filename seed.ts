import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.agent.upsert({
    where:  { id: 'gmail-agent' },
    update: {},
    create: {
      id:          'gmail-agent',
      name:        'Gmail Agent',
      type:        'gmail',
      description: 'Sleduje doručenú poštu, upozorňuje na neodpovedané emaily',
      isActive:    true,
    },
  })

  await prisma.agent.upsert({
    where:  { id: 'news-agent' },
    update: {},
    create: {
      id:          'news-agent',
      name:        'AI News Agent',
      type:        'news',
      description: 'Zbiera novinky od OpenAI, Anthropic, Google, Meta a ďalších',
      isActive:    true,
    },
  })

  console.log('✅ Seed dokončený – agenti vytvorení')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
