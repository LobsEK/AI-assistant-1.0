# ⚡ Agent Dashboard

Osobný AI dashboard s tmavým režimom. Sleduje Gmail a AI novinky (Anthropic, OpenAI, Google, Meta, Mistral) s automatickou AI analýzou.

---

## 📁 Štruktúra projektu

```
agent-dashboard/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   ← Google OAuth
│   │   ├── gmail/route.ts                ← Gmail API
│   │   ├── news/route.ts                 ← RSS + AI analýza
│   │   └── agents/route.ts               ← Agent manager
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                          ← Hlavná stránka
│   └── providers.tsx
├── components/
│   ├── Sidebar.tsx                       ← Ľavý panel s agentmi
│   ├── gmail/GmailView.tsx               ← Gmail dashboard
│   └── news/NewsView.tsx                 ← AI novinky
├── lib/
│   └── prisma.ts                         ← DB klient
├── prisma/
│   ├── schema.prisma                     ← Databázová schéma
│   └── seed.ts                           ← Počiatočné dáta
├── types/
│   ├── index.ts
│   └── next-auth.d.ts
├── .env.example                          ← Vzor pre .env
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Krok 1 — Inicializácia projektu

```bash
# Stiahni repozitár (alebo skopíruj súbory)
cd agent-dashboard

# Nainštaluj závislosti
npm install

# Skopíruj vzorový .env
cp .env.example .env
```

---

## 🔑 Krok 2 — Google Credentials pre Gmail

1. Choď na [console.cloud.google.com](https://console.cloud.google.com)
2. **Vytvor nový projekt** (napr. `agent-dashboard`)
3. Choď na **APIs & Services → Library**
4. Vyhľadaj a **aktivuj** `Gmail API`
5. Choď na **APIs & Services → OAuth consent screen**
   - User Type: **External**
   - Vyplň App name, User support email
   - Scopes: pridaj `gmail.readonly`
   - Test users: pridaj svoj Gmail
6. Choď na **APIs & Services → Credentials**
   - Klikni **+ Create Credentials → OAuth 2.0 Client IDs**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Skopíruj **Client ID** a **Client Secret** do `.env`

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tvoj_secret
```

---

## 🤖 Krok 3 — Anthropic API kľúč (pre AI analýzu)

1. Choď na [console.anthropic.com](https://console.anthropic.com)
2. **API Keys → Create Key**
3. Skopíruj do `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🔐 Krok 4 — NextAuth Secret

```bash
# Vygeneruj bezpečný secret
openssl rand -base64 32
```

Skopíruj výstup do `.env`:

```env
NEXTAUTH_SECRET=vygenerovany_retazec
NEXTAUTH_URL=http://localhost:3000
```

---

## 🗄️ Krok 5 — Databáza (SQLite / Prisma)

```bash
# Vygeneruj Prisma klienta
npx prisma generate

# Vytvor databázu a tabuľky
npx prisma db push

# Naplň počiatočnými agentmi
npx ts-node prisma/seed.ts
```

---

## ▶️ Krok 6 — Spustenie lokálne

```bash
npm run dev
```

Otvor prehliadač: **http://localhost:3000**

1. Klikni **Prihlásiť sa cez Google**
2. V ľavom paneli vyber **Gmail Agent** → zobrazí neodpovedané emaily
3. Vyber **AI News Agent** → načíta novinky s AI analýzou

---

## 📤 Krok 7 — Nahranie na GitHub

```bash
# Inicializuj Git (ak ešte nie je)
git init
git add .
git commit -m "feat: initial agent dashboard"

# Vytvor repozitár na github.com a prepoj
git remote add origin https://github.com/TVOJE_MENO/agent-dashboard.git
git branch -M main
git push -u origin main
```

> ⚠️ Súbor `.env` je v `.gitignore` — nikdy sa nenahrá na GitHub. Bezpečné.

---

## 🌐 Krok 8 — Nasadenie na Vercel

1. Choď na [vercel.com](https://vercel.com) a prihlás sa
2. **Add New → Project** → vyber tvoj GitHub repozitár
3. V sekcii **Environment Variables** pridaj všetky hodnoty z `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → nastav na `https://tvoja-app.vercel.app`
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL` → pre produkciu odporúčam zmeniť na PostgreSQL (napr. [Neon.tech](https://neon.tech) — zadarmo)
4. Klikni **Deploy**

### Dôležité — Google OAuth pre produkciu:
- V Google Console pridaj redirect URI: `https://tvoja-app.vercel.app/api/auth/callback/google`

### Upgrade na PostgreSQL (Vercel/Neon):
```env
DATABASE_URL=postgresql://user:pass@host/dbname
```
V `prisma/schema.prisma` zmeň:
```prisma
datasource db {
  provider = "postgresql"   # ← zmeň z "sqlite"
  url      = env("DATABASE_URL")
}
```
Potom: `npx prisma db push`

---

## 🛠️ Časté problémy

| Problém | Riešenie |
|---------|----------|
| `Error: GOOGLE_CLIENT_ID is not set` | Skontroluj `.env` súbor |
| Gmail vracia 401 | Skontroluj že máš Gmail API aktivovaný v Google Console |
| News agent nenačítava | RSS feedy môžu byť dočasne nedostupné, skús znova |
| `PrismaClientInitializationError` | Spusti `npx prisma db push` |

---

## 📦 Tech Stack

| Vrstva | Technológia |
|--------|-------------|
| Frontend + Backend | Next.js 14 (App Router) |
| Styling | Tailwind CSS (dark mode) |
| Auth | NextAuth.js + Google OAuth 2.0 |
| Database | SQLite lokálne / PostgreSQL v produkcii |
| ORM | Prisma |
| Gmail | Google APIs (googleapis) |
| AI analýza | Anthropic Claude Haiku |
| RSS parsing | rss-parser |
| Deployment | Vercel |
