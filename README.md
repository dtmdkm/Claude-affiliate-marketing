# Affitor Skills Web App

A Next.js web app that brings [Affitor's 52 affiliate marketing skills](https://github.com/Affitor/affiliate-skills) to the browser, powered by **Claude claude-sonnet-4-6**.

## Features

- **52 AI skills** across 8 stages: Research, Content, Blog, SEO, Landing Pages, Distribution, Analytics, Automation
- **Smart forms** with required/optional fields per skill
- **Streaming responses** from Claude with real-time output
- **Rendered markdown** output with copy button and raw view toggle
- **Responsive dark UI** with stage-based color coding and search/filter

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/dtmdkm/claude-affiliate-marketing.git
cd claude-affiliate-marketing
npm install
```

### 2. Configure API key

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com/).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A: One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dtmdkm/claude-affiliate-marketing)

### Option B: CLI deploy

```bash
npm install -g vercel
vercel
```

### Option C: GitHub integration

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Click **Deploy**

### Setting environment variables on Vercel

In your Vercel project dashboard:
1. Go to **Settings → Environment Variables**
2. Add `ANTHROPIC_API_KEY` with your Anthropic API key
3. Set it for **Production**, **Preview**, and **Development**
4. Redeploy

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage — skill grid with search/filter
│   ├── skill/[slug]/
│   │   └── page.tsx          # Individual skill page with form
│   └── api/skill/
│       └── route.ts          # API route — proxies to Claude API (streaming)
├── components/
│   ├── SkillCard.tsx         # Card component for the grid
│   ├── SkillForm.tsx         # Dynamic form builder for skill inputs
│   └── ResultDisplay.tsx     # Markdown result with copy button
└── lib/
    └── skills.ts             # All 52 skills data with prompts & field configs
```

## Skills Overview

| Stage | Count | Description |
|-------|-------|-------------|
| 🔍 Research | 10 | Find and evaluate affiliate programs |
| ✍️ Content | 7 | Create viral social media content |
| 📝 Blog | 7 | Long-form SEO-optimized articles |
| 🚀 Landing | 8 | High-converting affiliate pages |
| 📤 Distribution | 4 | Link hubs, bio pages, deployment |
| 📊 Analytics | 5 | Track, measure, and optimize |
| ⚙️ Automation | 5 | Automate workflows and scale |
| 🧭 Meta | 6 | Discovery, planning, compliance |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

## Tech Stack

- **Next.js 15** (App Router)
- **Tailwind CSS**
- **@anthropic-ai/sdk** — Claude claude-sonnet-4-6 streaming
- **react-markdown** + **remark-gfm** — rendered output
- **TypeScript**

## License

Skills content from [Affitor/affiliate-skills](https://github.com/Affitor/affiliate-skills) — MIT License.
