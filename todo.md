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
- [x] Implement `/add_topic` to persist a topic to the user
- [x] Implement `/topics` to list current interests
- [x] Implement `/remove_topic` to delete from interests

---

## 📡 PHASE 2: Ingestion & Summarization Pipeline

### 🌟 Goal: Background agents curate content from interest feeds

### Step 1: Schema + Embeddings Infrastructure
- [x] Add `content_sources` table to Supabase
- [x] Add `embedding` field to `topics` table
- [x] Integrate OpenAI API for `text-embedding-3-small`
- [x] Generate embeddings on topic creation and store in DB
- [x] Create SQL function for cosine similarity search on embeddings

### Step 2: Feed Ingestion
- [ ] Define and store initial RSS feeds in `content_sources`
  - [ ] Include `url`, `name`, `description`, `source_type`, `embedding`
  - [ ] Add seed content sources (e.g., JAMA, NYT Health, Hacker News)
- [ ] Build feed puller
  - [ ] RSS parsing worker (Node script or Supabase function)
  - [ ] Store raw articles in `raw_content` table
  - [ ] De-duplicate content

### Step 3: Matching Content to Topics
- [ ] Generate embeddings for new articles
- [ ] Use cosine similarity to match articles to user topics
- [ ] Store matched content in `topic_matches` table

### Step 4: Summarization Pipeline
- [ ] Generate summaries for matched articles
  - [ ] Use GPT-4o / Claude Opus API for summarization
  - [ ] Store summaries in `summaries` table linked to raw content
- [ ] Add support for basic categorization tags (e.g. "quick", "deep dive")

### Step 5: Delivery via Telegram
- [ ] Extend `/brief` command to query for latest summaries
  - [ ] Filter by `user_topics` and `published_at`
  - [ ] Prioritize quick reads vs longform
  - [ ] Format nicely in Telegram message block

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
