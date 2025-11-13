# 🌍 Political Discourse Dashboard

### AI-powered sentiment analysis of real-time news in Sweden & Portugal

A full-stack TypeScript project that ingests news articles, performs ML-based sentiment analysis (Hugging Face), extracts entities, and visualizes trends across multiple political/societal topics — all updated automatically.

This project demonstrates professional-grade full stack skills, including:

• Full-stack architecture (React + Vite + Express + PostgreSQL)
• Type safety end-to-end (TypeScript everywhere)
• ML integration using Hugging Face Inference API
• Real-time backend triggers using Server-Sent Events
• Scheduled ingestion job (Node Cron + Railway)
• Database modeling & querying with Prisma
• Data visualization (Recharts)
• CI-friendly, deploy-ready monorepo with pnpm workspaces
• Cloud deployment on Vercel + Railway

## 🚀 Live Demo
👉 [https://political-discourse-news-web.vercel.app/](here)
Frontend: Vercel
Backend API: Railway

📸 Screenshot
![Screenshot](./screenshot.png)

✨ Features
🔎 Multi-Topic Sentiment Tracking

Choose topics such as climate, economy, policy, and safety.
View sentiment trends over: 
• 1 week
• 2 weeks
• 3 weeks
• 1 month

🧠 ML-Powered Sentiment Analysis
Uses Hugging Face's DistilBERT (SST-2) model to classify article tone:

• POSITIVE → normalized toward 1
• NEGATIVE → normalized toward 0

Ensures smooth 0–1 sentiment scale across the dashboard.

## 📰 Automated News Ingestion
Every hour, the backend:

1. Fetches the latest articles
2. Cleans & stores them
3. Runs sentiment analysis
4. Extracts mentioned entities
5. Aggregates & exposes insights via API

Powered by:

• NewsAPI (as source)
• Cron scheduler in Node
• PostgreSQL on Railway

## 📊 Interactive Dashboard
Built with React + Recharts:

• Smooth sentiment curves
• Real-time updates via SSE
• Topic legend with color coding
• Dynamic country switching (Sweden / Portugal)
• Automatically adjusts to mobile screens

## 🛠 Modern Full-Stack Setup

• Monorepo with pnpm workspaces
• API: Node + Express + Prisma
• Frontend: React + Vite + TailwindCSS
• Database: PostgreSQL (Railway)
• ML API: Hugging Face inference
• Deployment:
    • Frontend → Vercel
    • API → Railway


## 🏗 Architecture

political-discourse-dashboard
│
├── apps/
│   ├── api/          # Express API + Cron jobs + Prisma
│   └── web/          # React frontend (Vite)
│
├── packages/
│   └── config/       # Shared tsconfig & lint setup
│
└── prisma/           # DB models & migrations

## 🔧 Tech Stack
### Frontend

• React + TypeScript
• Vite
• Tailwind CSS
• Recharts (visualization)

### Backend

• Node.js + TypeScript
• Express.js
• Prisma ORM
• Hugging Face Sentiment Model
• node-cron
• Server-Sent Events (real-time)

### Infrastructure

• Railway (API + PostgreSQL)
• Vercel (Frontend)
• pnpm monorepo
• Environment variable–driven config

## 🧪 Running Locally
1. Install dependencies
pnpm install

2. Set environment variables

Create .env files:

apps/api/.env
DATABASE_URL="postgresql://..."
NEWSAPI_KEY="..."
HF_API_KEY="..."
ENABLE_INGESTION=false   # Optional: enable cron ingestion

apps/web/.env
VITE_API_BASE="http://localhost:4000"

3. Start both frontend + backend
pnpm dev

## 🔄 Ingestion Job (Cron)

Runs every hour:

cron.schedule("5 * * * *", () => {
  ingestFromNewsAPI(...)
})


Can be toggled with:

ENABLE_INGESTION=true / false

## 📦 Deployment

• Frontend deployed on Vercel
• Backend deployed on Railway, with PostgreSQL
• Mock data seeding is supported for demo mode
• Supports HTTPS + CORS for production use

## 🤝 Recruiter Notes (Why This Project Matters)

This repo demonstrates:

• Real experience building a distributed, production-grade system
• Integration of machine learning into a real product
• Handling of scheduling, data pipelines, and API architecture
• Clean, professional React UI with responsive design
• Practical understanding of cloud deployment, DevOps, and environment config
• Strong knowledge of TypeScript, Prisma, and modern frontend tooling

If you're evaluating this project:
👉 It shows readiness for full-stack, backend, or ML-adjacent roles.