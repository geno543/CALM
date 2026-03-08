<div align="center">

# CALM
### Cognitive Apprenticeship via LLMs

**A neuro-symbolic AI tutor that closes the STEM achievement gap through PhD-level personalized mentorship.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-calm--virid.vercel.app-58A6FF?style=flat-square&logo=vercel)](https://calm-virid.vercel.app)
[![Backend](https://img.shields.io/badge/API-Railway-3DDC97?style=flat-square&logo=railway)](https://calm-production.up.railway.app)
[![React](https://img.shields.io/badge/React-19-58A6FF?style=flat-square&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-3DDC97?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-F0A04B?style=flat-square)](LICENSE)

</div>

---

## What is CALM?

Most students worldwide cannot afford a private tutor. CALM is the alternative — a free, bilingual (Arabic + English) AI tutor grounded in real textbooks, with a cognitive model of each student built from Bayesian Knowledge Tracing. It does not give answers. It asks questions that make you find them.

**Calculus is live now. Biology, Chemistry, and Physics are coming soon.**

---

## Core Architecture

```
┌────────────────────────────────────────────────────┐
│                    Browser (Vercel)                 │
│   React 19 · Vite · Tailwind v4 · TypeScript        │
│   Zustand auth · KaTeX math · ReactMarkdown + SSE   │
└────────────────────┬───────────────────────────────┘
                     │ HTTPS / SSE
┌────────────────────▼───────────────────────────────┐
│                  API (Railway)                      │
│   FastAPI · Python 3.12 · Uvicorn                   │
│   LangChain · ChromaDB · Sentence Transformers      │
└─────────┬───────────────────────┬──────────────────┘
          │                       │
┌─────────▼──────┐     ┌──────────▼──────────────────┐
│   Supabase     │     │   K2 API (MBZUAI)            │
│   Auth + JWT   │     │   K2-Think-v2 LLM            │
└────────────────┘     │   HackClub proxy (embeddings)│
                       └──────────────────────────────┘
```

---

## Features

| Feature | Detail |
|---|---|
| **Socratic Tutoring** | Never gives the answer directly — guides with targeted questions to build real understanding |
| **Direct Mode** | Student-toggled mode for instant full explanations and worked examples |
| **RAG-Grounded** | Every response anchored to verified textbook passages via ChromaDB vector search |
| **Bayesian Knowledge Tracing** | Real-time per-concept mastery estimation across 7 calibrated levels |
| **Subject Picker** | `/subjects` page — Calculus live, Biology / Chemistry / Physics coming soon |
| **Session Summary** | AI-generated structured Markdown summary (concepts, rules, mistakes, next steps) |
| **Progress Map** | Visual mastery heatmap across all curriculum chapters |
| **Bilingual** | Full Arabic + English UI with RTL-aware layouts throughout |
| **Token Streaming** | Token-by-token SSE for near-instant response feel |
| **Math Rendering** | KaTeX with automatic normalization of all LaTeX delimiter styles |
| **Chapter Locking** | Non-active chapters are locked until unlocked via the progress map |

### Mastery Levels (BKT)

| Level | Label | P(mastery) |
|---|---|---|
| 1 | Intuitive Primitive | < 20% |
| 2 | Formal Axiomatic | < 35% |
| 3 | Visualization | < 50% |
| 4 | Heuristic Deconstruction | < 65% |
| 5 | Heavyweight Synthesis | < 80% |
| 6 | Theoretical Convergence | < 92% |
| 7 | Frontier Research | ≥ 92% |

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 6 | Build tool |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Framer Motion | 12 | Animations |
| React Router | 7 | Client-side routing |
| Zustand | 5 | Auth state management |
| KaTeX + remark-math + rehype-katex | latest | Math rendering |
| react-markdown + remark-gfm | latest | Markdown + GFM tables |
| @supabase/supabase-js | 2 | Authentication client |
| Radix UI | latest | Accessible UI primitives |

### Backend

| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.115 | API framework |
| Uvicorn | 0.32 | ASGI server |
| LangChain | 0.3 | LLM orchestration + RAG chains |
| ChromaDB | 0.5 | Vector store for RAG |
| Sentence Transformers | 3.3 | Embedding model |
| PyPDF | 5 | PDF ingestion |
| sse-starlette | 2.1 | Server-Sent Events streaming |
| httpx | — | Async Supabase JWT validation |

### Infrastructure

| Service | Role |
|---|---|
| Vercel | Frontend hosting + global CDN |
| Railway | Backend Docker deployment |
| Supabase | Auth (JWT) + user management |
| K2 API (MBZUAI) | `K2-Think-v2` LLM inference |
| HackClub AI Proxy | OpenAI-compatible embeddings endpoint |

---

## Repository Structure

```
CALM/
├── frontend/                      # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.tsx        # Marketing landing page
│   │   │   ├── AuthPage.tsx       # Supabase login / signup
│   │   │   ├── SubjectSelect.tsx  # Subject picker (post-login)
│   │   │   ├── ChatLayout.tsx     # Main chat UI
│   │   │   └── ProgressMap.tsx    # Mastery heatmap
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx  # Markdown + KaTeX renderer with math normalizer
│   │   │   ├── ChatInput.tsx      # Input bar
│   │   │   ├── MasteryPanel.tsx   # BKT sidebar panel
│   │   │   └── ChapterNav.tsx     # Chapter list with progress-based locking
│   │   ├── stores/
│   │   │   └── authStore.ts       # Zustand auth store
│   │   ├── contexts/
│   │   │   └── LanguageContext.tsx
│   │   └── lib/
│   │       ├── api.ts             # Axios client + 401 JWT refresh-retry
│   │       └── supabase.ts        # Supabase client
│   ├── vercel.json
│   └── package.json
│
├── backend/                       # FastAPI service
│   ├── main.py                    # All API routes
│   ├── auth.py                    # Supabase JWT middleware
│   ├── session.py                 # Per-user session persistence
│   ├── models.py                  # Pydantic request/response models
│   └── requirements.txt
│
├── deploy/
│   └── trail_4.py                 # LangChain chains, BKT logic, RAG retrieval
│
├── Dockerfile                     # Backend container (Python 3.12-slim, CPU torch)
├── railway.toml                   # Railway deployment config
└── vercel.json                    # Vercel SPA rewrite + build config
```

---

## API Reference

All endpoints require `Authorization: Bearer <supabase_access_token>`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/auth/me` | Validate token, return current user |

### Student State

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/student/state` | — | BKT state, mastery per chapter, current level |
| `POST` | `/student/reset` | — | Reset session and all mastery progress |
| `PATCH` | `/student/chapter` | `{ "chapter": "limits.pdf" }` | Switch active chapter |
| `PATCH` | `/student/mode` | `{ "learning_mode": true }` | Toggle Socratic / Direct mode |

### Chat

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `GET` | `/chat/history` | — | Full conversation history array |
| `POST` | `/chat/summary` | — | Generate AI-powered session summary |
| `POST` | `/chat/stream` | `{ "message": "...", "learning_mode": true }` | SSE streaming chat response |

### SSE Event Types (`POST /chat/stream`)

| Event | Payload | Description |
|---|---|---|
| `ping` | `""` | Keepalive during preparation phase |
| `token` | `"<string>"` | Single streamed response token (JSON-encoded) |
| `meta` | `{ mode, eval, student_state }` | Final mastery state pushed after response completes |
| `done` | `"[DONE]"` | Stream complete signal |

---

## Calculus Curriculum

| Chapter File | Topic |
|---|---|
| `functions.pdf` | Functions & Their Graphs |
| `limits.pdf` | Limits and Continuity |
| `derivatives.pdf` | Differentiation |
| `derivative_apps.pdf` | Applications of Derivatives |
| `integrals.pdf` | Integration |
| `integrals_apps.pdf` | Applications of Integration |

> Source: **Thomas's Calculus, 14th Edition**

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- A [Supabase](https://supabase.com) project (free tier works)
- A K2 API key from [k2think.ai](https://k2think.ai)
- A HackClub AI proxy key

### 1. Clone

```bash
git clone https://github.com/geno543/CALM.git
cd CALM
```

### 2. Backend

```bash
# Install CPU-only torch first to avoid pulling 2 GB of CUDA libraries
pip install torch==2.5.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
pip install -r backend/requirements.txt

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env — see Environment Variables section below

# Place chapter PDFs in deploy/
# (functions.pdf, limits.pdf, derivatives.pdf, derivative_apps.pdf,
#  integrals.pdf, integrals_apps.pdf)

# Start the API server
cd backend
uvicorn main:app --reload --port 8000
```

ChromaDB vector stores are built automatically on first startup from the PDFs, then cached to `deploy/db_*/`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — see Environment Variables section below

npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## Environment Variables

### `backend/.env`

```env
# Supabase — for JWT validation
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# HackClub AI proxy — OpenAI-compatible embeddings
API_KEY=your-hackclub-api-key
BASE_URL=https://ai.hackclub.com/proxy/v1

# K2 Think — LLM inference
K2_API_KEY=your-k2-api-key
K2_BASE_URL=https://api.k2think.ai/v1
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Deployment

### Frontend → Vercel

1. Import the repository on [vercel.com](https://vercel.com)
2. No root directory change needed — `vercel.json` at the project root configures the build command, output directory (`frontend/dist`), and SPA rewrites automatically
3. Add the frontend environment variables in the Vercel project dashboard

### Backend → Railway

1. Connect the repository on [railway.app](https://railway.app)
2. Railway detects `railway.toml` and builds using the `Dockerfile`
3. Add the backend environment variables in the Railway service settings
4. Ensure the chapter PDFs exist in `deploy/` (committed to the repo or mounted as a persistent volume)

The `Dockerfile` installs CPU-only PyTorch before the rest of the dependencies, keeping the final image around 1 GB instead of 3+ GB with CUDA.

---

## How the Pipeline Works

```
Student sends a message
        │
        ▼
  prepare_chat()                   ← runs in thread pool (non-blocking)
    ├── chapter detection          ← identifies relevant curriculum section
    ├── RAG retrieval              ← top-k chunks from ChromaDB vector store
    ├── BKT update                 ← Bayesian update on P(mastery) for the concept
    └── mode routing               ← TUTOR_MODE / DIRECT_MODE / NORMAL_MODE
        │
        ▼
  chain.astream()                  ← token-by-token SSE to browser
    ├── <think>...</think> block   ← K2-Think reasoning buffered and stripped
    └── real answer streamed
        │
        ▼
  session saved + meta event       ← updated mastery levels pushed to client
```

### Chat Modes

| Mode | Trigger | Behavior |
|---|---|---|
| `TUTOR_MODE` | Default (`learning_mode: true`) | Socratic — guided questions, never the direct answer |
| `DIRECT_MODE` | Student toggles learning mode off | Full, clear explanations with worked examples |
| `NORMAL_MODE` | Non-subject queries | General conversational response |

---

## Roadmap

- [x] Calculus — Thomas's Calculus, 14th Ed.
- [ ] Biology — Campbell Biology
- [ ] Chemistry — Zumdahl Chemistry
- [ ] Physics — Halliday & Resnick
- [ ] Spaced repetition scheduling
- [ ] Cross-chapter BKT knowledge graph
- [ ] Student analytics dashboard
- [ ] Mobile app (React Native)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit using conventional commits: `git commit -m "feat: add ..."`
4. Push and open a Pull Request

Keep PRs focused — one feature or fix per PR.

---

## License

MIT © 2026 CALM Project

---

<div align="center">
  <sub>Built for under-resourced students worldwide. Free forever.</sub><br/>
  <sub>Powered by <strong>K2-Think-v2</strong> × <strong>MBZUAI</strong></sub>
</div>
