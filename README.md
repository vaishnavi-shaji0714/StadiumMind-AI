<div align="center">

# ⚽ StadiumMind AI

### AI-Powered FIFA World Cup 2026 Stadium Operations Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.125-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-FF6C37?style=flat)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)

</div>

---

## 📋 Overview

**StadiumMind AI** is a real-time intelligent stadium operations platform built for the FIFA World Cup 2026. It combines a premium React frontend with a production-grade FastAPI backend, powered by Groq's ultra-fast LLaMA 3.3 70B model to deliver an AI assistant that can handle crowd management, navigation, transport, accessibility, safety, and live match operations — all from one command center.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Operations Copilot** | Real-time streaming AI chat powered by Groq LLaMA 3.3 70B |
| 👥 **Crowd Intelligence** | Live density heatmaps across all stadium sectors |
| 🗺️ **Interactive Stadium Map** | Clickable SVG map with gate, sector, and POI filtering |
| 📊 **Operations Dashboard** | KPI strip, crowd trends, queue predictions, alerts, transport & sustainability |
| 🔐 **Secure Authentication** | JWT sessions via HTTP-only cookies, route guards, and protected pages |
| 🚇 **Transport Management** | Metro, bus, shuttle, and parking status integration |
| ♿ **Accessibility Routing** | Barrier-free navigation and accessible gate recommendations |
| 🌿 **Sustainability Dashboard** | Energy, water, CO₂, and FIFA platinum compliance tracking |

---

## 🏗️ Tech Stack

### Frontend
- **React 19** + **TypeScript 5.9**
- **Vite 8** — hot module replacement, API proxy
- **Tailwind CSS v4** — utility-first styling
- **Vanilla CSS Animations** — glassmorphism, parallax, micro-interactions

### Backend
- **FastAPI** — async Python REST API
- **Uvicorn** — ASGI server with hot-reload
- **SQLAlchemy** + **SQLite** — ORM with conversation history
- **PyJWT** + **bcrypt** — secure authentication
- **httpx** — async streaming HTTP client for Groq

### AI
- **Groq API** — `llama-3.3-70b-versatile` model
- Streaming responses via Server-Sent Events (SSE)
- Conversation memory with SQLite persistence
- Graceful simulation fallback when API key is absent

---

## 📁 Project Structure

```
smart-stadium-management/
├── src/                        # React frontend
│   ├── App.tsx                 # All views, routing, auth logic
│   ├── index.css               # Design system & animations
│   └── main.tsx                # React entry point
│
├── backend/                    # FastAPI backend
│   └── app/
│       ├── config/
│       │   ├── config.py       # Pydantic settings
│       │   └── database.py     # SQLAlchemy models & DB init
│       ├── routes/
│       │   ├── auth.py         # /api/auth/* endpoints
│       │   └── chat.py         # /api/chat streaming endpoint
│       ├── services/
│       │   └── grok.py         # Groq API integration layer
│       └── main.py             # FastAPI app + middleware
│
├── public/
│   └── manifest.json           # PWA manifest
├── index.html                  # App shell with metadata
├── vite.config.ts              # Vite + proxy config
├── .env.example                # Environment variable template
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+
- **Python** 3.11+
- **pnpm** (installed via npx automatically)
- A **Groq API key** from [console.groq.com](https://console.groq.com)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-stadium-management.git
cd smart-stadium-management
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```ini
GROK_API_KEY=your-groq-api-key-here
JWT_SECRET=your-random-secret-string
```

### 3. Install frontend dependencies

```bash
npx pnpm install
```

### 4. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 5. Start the backend server

```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 6. Start the frontend dev server

```bash
npx pnpm dev
```

### 7. Open the app

Visit **[http://localhost:8443](http://localhost:8443)**

---

## 🔑 Demo Credentials

| Field | Value |
|---|---|
| Email | `demo@example.com` |
| Password | `Demo@123` |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `POST` | `/api/chat` | Send message, receive streamed AI response |
| `GET` | `/health` | Backend health check |

---

## 🛡️ Security

- **JWT** tokens stored in HTTP-only cookies (not localStorage)
- **bcrypt** password hashing
- **Rate limiting** middleware (100 req/min per IP)
- **CORS** + **Helmet-style** security headers (CSP, HSTS, X-Frame-Options)
- **Input validation** via Pydantic models
- **Route guards** on all protected pages

---

## 🤖 AI Assistant Capabilities

The StadiumMind AI assistant is scoped exclusively to stadium operations and can handle:

- Crowd density & sector status
- Gate navigation & queue times
- Parking & transport updates
- Accessibility routing
- Emergency response guidance
- Food courts, restrooms & facilities
- Match info & sustainability metrics

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ for FIFA World Cup 2026
</div>
