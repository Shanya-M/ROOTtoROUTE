# Root to Route — Product Requirements Document

## Original Problem Statement
A beginner's guide to arable farming called "Root to Route". Color scheme:
dark brown, light green, tan. Three pages — Home, Dashboard, Guide — plus
auth-protected private articles and an AI assistant.

- Persona: solo beginner farmer managing one plot/garden
- Location: auto-detect via browser GPS on first visit
- AI assistant: chat + personalised advice using soil/crops/weather context

## User Choices (verbatim)
- JWT custom auth (email/password)
- Claude Sonnet 4.5 via Emergent Universal LLM Key
- Open-Meteo for weather
- Unsplash/Pexels stock images for articles
- Kaggle crop-NPK + Zenodo yield datasets as reference for recommendations

## Architecture
- Backend: FastAPI + MongoDB (motor) + bcrypt + PyJWT + httpx (Open-Meteo) +
  emergentintegrations.LlmChat (Anthropic claude-sonnet-4-5-20250929, streaming SSE)
- Frontend: React 19 + react-router 7 + axios (withCredentials) + Recharts +
  sonner + lucide-react + Tailwind + Cormorant Garamond / Outfit fonts
- Theme: bg #1C1614 / surface #2A221F / primary #9EB27A / secondary #CBA279

## Implemented (2026-02)
- Auth: register / login / logout / me with httpOnly cookie
- Home page: hero + 7-day weather chart + soil status + alerts + planting
  calendar + recent activities
- Dashboard: soil form, NPK bar chart, pH radial gauge, history line chart,
  top-3 crop recommender (confidence + ideal range), fertilizer plan
  (synthetic + organic), yield estimator, crop rotation, streaming AI chat
- Guide: 9 curated articles with matching images + private user notes (CRUD)
- Recommendations powered by 28-crop reference dataset + family-based rotation

## Backlog / Next Action Items
- P1: Migrate FastAPI startup/shutdown to lifespan handlers, split server.py
  into routers (auth, soil, recommend, articles, chat)
- P1: Tag chat assistant rows with user_id (currently keyed by session_id only)
- P2: Tighten CORS (explicit origin + allow_credentials=True) and use
  secure=True cookies in production
- P2: Add soil-reading reminders + scheduled push of weather alerts
- P2: Allow image upload (object storage) for private articles instead of URL
- P3: Mobile bottom-nav, dark/light mode toggle (palette already supports it)
