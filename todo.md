# Aperture MVP Task Breakdown

## 🧭 Aperture: Product Overview

### Core Thesis

Aperture helps you stay informed and go deep — by turning scattered content into personalized, actionable insight.

It’s a curation engine and knowledge assistant that:
	-	Delivers daily, AI-summarized briefs of your topics
	-	Surfaces longform reading, podcasts, and videos
	-	Tracks in-progress content and helps you resume intelligently
	-	Allows both wide-angle scanning and deep focus dives

### Target User
	-	Knowledge workers, researchers, builders, creators
	-	Struggling with info overload and shallow scrolling
	-	Want to use AI to focus, not distract

### Key Use Cases
	1.	5-Minute Cortado Catchup → Tap /brief and instantly get updated
	2.	Daily Digest Ritual → Recap of what’s new and what’s unfinished
	3.	Deep Dive Mode → Resume that podcast, finish that paper, return to a longform article you didn’t finish last night

## ⚙️ PHASE 1: Scaffolding & Command Layer

### 🌟 Goal: Users can interact with a Telegram bot and manage topic interests

- [x] Create Telegram bot and wire up grammY
- [x] Stub `/brief`, `/topics`, `/add_topic`, `/remove_topic`
- [x] Set up Supabase project
- [x] Create `users` and `topics` tables
- [ ] Implement `/add_topic` to persist a topic to the user
- [ ] Implement `/topics` to list current interests
- [ ] Implement `/remove_topic` to delete from interests

---

## 📡 PHASE 2: Ingestion & Summarization Pipeline

### 🌟 Goal: Background agents curate content from interest feeds

- [ ] Set up a basic topic-to-feed mapping (hardcoded or in Supabase)
- [ ] Ingest RSS feeds via polling (e.g., node-cron + `rss-parser`)
- [ ] Summarize each article using GPT-4o or Claude via API
- [ ] Store summaries in Supabase (`summaries` table: id, topic, content, source_url, etc.)
- [ ] Ensure deduping / rate-limiting of fetches per source
- [ ] (Optional) Use Readability/Puppeteer to extract full article content for better summarization

---

## 🧠 PHASE 3: Command Intelligence + /brief

### 🌟 Goal: The bot gives you daily/weekly curated summaries across topics

- [ ] `/brief` command: fetch most recent 3–5 summaries across user’s topics
- [ ] Format summaries cleanly with source links
- [ ] Add inline buttons: “Save,” “Open,” “More Like This”
- [ ] Track user read/click history (optional for personalization later)

---

## 🔍 PHASE 4: Longform + Multimedia Sync (Optional for MVP)

### 🌟 Goal: Allow tracking of longform content (YouTube, podcasts)

- [ ] Integrate YouTube + Spotify APIs
- [ ] Store user's "currently playing" or "in-progress" media
- [ ] Enable `/resume` command: resume where you left off

---

## 🧢 PHASE 5: Agentic Workflows (Stretch Goal)

### 🌟 Goal: Let agents research + summarize in background across a topic

- [ ] Build agent template in LangChain or plain JS: "Research and summarize [X topic]"
- [ ] Schedule research tasks nightly or weekly
- [ ] Deliver digest via `/brief` or `/digest` commands

---

## 🤮 Meta

- [ ] Create CLI or small admin UI for seeding feeds/topics
- [ ] Configure environment variables securely
- [ ] Add error logging (Sentry, console, or Telegram DM)
- [ ] Set up simple CI/deploy if desired
