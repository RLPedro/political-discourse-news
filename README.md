📸 Screenshot
![Screenshot](./screenshot.png)

# 🌍 Political Discourse Dashboard

A full-stack, ML-powered dashboard that analyzes news sentiment across Sweden and Portugal.

This project pulls real news articles, runs sentiment analysis using a Hugging Face model, stores insights in PostgreSQL, and visualizes trends in a clean React dashboard.

Built to demonstrate modern full-stack engineering, API design, cloud deployment, and real-world ML integration.

## 🚀 Live Demo
[https://political-discourse-news-web.vercel.app/](here)

Frontend: Vercel
Backend API: Railway

## ✨ What This Project Shows

• Full-stack TypeScript (React, Express, Prisma)
• Real ML integration using Hugging Face sentiment analysis
• Automated data ingestion + scheduled jobs
• Clean API design with Zod validation & Prisma ORM
• Cloud deployment across Vercel (web) and Railway (API + DB)
• Interactive data visualization with Recharts
• Monorepo structure, pnpm workspaces, environment management

This is the kind of system you would build in a real production setting: data ingestion, feature extraction, analysis, persistence, and presentation.

## 🧠 Features
### ML Sentiment Analysis

Uses the Hugging Face model distilbert-base-uncased-finetuned-sst-2-english to classify article sentiment and map it to a 0–1 score for visualization.

### Automated News Ingestion

A cron job fetches articles hourly, analyzes them, and stores results.
If NewsAPI rate limits, the system can use mock data.

### Multi-Topic Trend Visualization

Tracks sentiment for topics like climate, economy, policy, and safety across time ranges (1–4 weeks).
Includes country switching (Sweden / Portugal).

### Modern Dashboard

• Responsive UI
• Smooth sentiment curves
• Topic color legend
• Source contribution list
• Hourly auto-updating badge

## 🛠 Tech Stack

Frontend: React, TypeScript, Vite, TailwindCSS, Recharts
Backend: Node.js, Express, Prisma, PostgreSQL, Hugging Face API, node-cron
Infra: Vercel (web), Railway (API + DB), pnpm monorepo

## 🏗 Project Structure

apps/
  api/   → Express API + cron + ML pipeline
  web/   → React dashboard
packages/
  config → shared TS/ESLint configs

## 🔧 Environment Variables
### API (apps/api/.env)

DATABASE_URL=your_postgres_url
HF_API_KEY=your_huggingface_key
NEWSAPI_KEY=your_newsapi_key
ENABLE_INGESTION=true

### Frontend (apps/web/.env)

VITE_API_BASE="https://your-api.up.railway.app"

## 💻 Running Locally

Install dependencies:
pnpm install

Start API + Web:
pnpm dev

Seed mock data (optional):
cd apps/api
pnpm tsx prisma/seed_mock.ts

## 📦 Deployment
### Railway (API)

• Deploy apps/api
• Attach PostgreSQL
• Add environment variables
• Railway runs pnpm -C apps/api build then pnpm -C apps/api start

### Vercel (Frontend)

• Deploy apps/web
• Add VITE_API_BASE pointing to your Railway API domain

## 👤 About This Project

This dashboard was built to demonstrate:
• End-to-end system thinking
• Practical use of ML in a real product
• Production-style API development
• Frontend engineering with modern tooling
• Cloud-native deployment workflows