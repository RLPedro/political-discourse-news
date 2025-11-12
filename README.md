# 📰 Political Discourse Dashboard

A full-stack TypeScript application that analyzes and visualizes **news sentiment** across sustainability, economy, policy, and safety topics — focused on **Sweden** and **Portugal**.

The app fetches real-world news from [NewsAPI.org](https://newsapi.org), analyzes sentiment using a Hugging Face ML model, stores results in a PostgreSQL database, and displays interactive dashboards in a modern React frontend.

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + TypeScript + Vite + TailwindCSS + Recharts |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma |
| **Data Source** | [NewsAPI.org](https://newsapi.org) |
| **Sentiment Analysis** | Hugging Face Inference API |
| **Scheduling** | `node-cron` |
| **Deployment Ready** | Works locally or in containerized setups |

---

## ⚙️ Setup

### 1️⃣ Requirements
- Node.js ≥ 18
- PostgreSQL running locally (or remote URL)
- [NewsAPI.org](https://newsapi.org) API key
- [Hugging Face](https://huggingface.co/settings/tokens) API token (free)

### 2️⃣ Environment variables

Create `.env` in `apps/api/`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/pdd
NEWSAPI_KEY=your_newsapi_key_here
HF_API_KEY=your_huggingface_api_key_here
INGEST_TERMS=climate,economy,policy,safety
INGEST_COUNTRIES=SE,PT
INGEST_DAYS=2
INGEST_PAGE_SIZE=50
NEWSAPI_MAX_PAGES=2


| Command                          | Description                             |
| -------------------------------- | --------------------------------------- |
| `pnpm dev`                       | Run both API and frontend in watch mode |
| `pnpm -C apps/api ingest`        | Run ingestion manually                  |
| `pnpm -C apps/api prisma studio` | Open Prisma database viewer             |
| `pnpm typecheck`                 | Run TypeScript type checks              |
| `pnpm lint`                      | Lint all projects                       |
