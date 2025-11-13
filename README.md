📸 **Screenshot**  
![Screenshot](./screenshot.png)

# 🌍 Political Discourse Dashboard

A full-stack, ML-powered dashboard that analyzes news sentiment across **Sweden** and **Portugal**.

This project pulls real news articles, runs sentiment analysis using a Hugging Face model, stores insights in PostgreSQL, and visualizes trends in a clean React dashboard.

Built to demonstrate modern full-stack engineering, API design, cloud deployment, and real-world ML integration.

---

## 🚀 Live Demo  
👉 [here](https://political-discourse-news-web.vercel.app/)

- **Frontend**: Vercel  
- **Backend API**: Railway

---

## ✨ What This Project Shows

- Full-stack TypeScript (React, Express, Prisma)
- Real ML integration using Hugging Face sentiment analysis
- Automated data ingestion + scheduled jobs
- Clean API design with Zod validation & Prisma ORM
- Cloud deployment across Vercel (web) and Railway (API + DB)
- Interactive data visualization with Recharts
- Monorepo structure, pnpm workspaces, environment management

> This is the kind of system you would build in a real production setting: data ingestion, feature extraction, analysis, persistence, and presentation.

---

## 🧠 Features

### ML Sentiment Analysis
Uses the Hugging Face model `distilbert-base-uncased-finetuned-sst-2-english` to classify article sentiment and map it to a **0–1 score** for visualization.

### Automated News Ingestion
A cron job fetches articles **hourly**, analyzes them, and stores results.  
If NewsAPI rate limits, the system falls back to **mock data**.

### Multi-Topic Trend Visualization
Tracks sentiment for topics like:
- Climate
- Economy
- Policy
- Safety

Across time ranges: **1–4 weeks**  
Includes **country switching** (Sweden / Portugal)

### Modern Dashboard
- Responsive UI
- Smooth sentiment curves
- Topic color legend
- Source contribution list
- Hourly auto-updating badge

---

## 🛠 Tech Stack

**Frontend**:  
React, TypeScript, Vite, TailwindCSS, Recharts

**Backend**:  
Node.js, Express, Prisma, PostgreSQL, Hugging Face API, node-cron

**Infra**:  
Vercel (web), Railway (API + DB), pnpm monorepo

---

## 🔧 Environment Variables

### API (`apps/api/.env`)
```env
DATABASE_URL=your_postgres_url
HF_API_KEY=your_huggingface_key
NEWSAPI_KEY=your_newsapi_key
ENABLE_INGESTION=true