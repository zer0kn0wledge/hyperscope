# HyperScope

Real-time analytics dashboard for Hyperliquid with cross-exchange comparisons.

![HyperScope](https://img.shields.io/badge/HyperScope-Analytics-00D1FF?style=flat&labelColor=0A0E14)

## Features

- **Market Overview** — KPI cards, market heatmap, real-time large trades feed
- **Market Analytics** — Per-asset deep dive with OHLCV charts, funding rates, OI, volume, liquidations
- **Orderbook Depth** — Real-time L2 orderbook visualization with depth chart and spread tracking
- **Trader Analytics** — Whale leaderboard, address lookup, position tracking, PnL analysis
- **Protocol Health** — Revenue metrics, Assistance Fund tracking, HLP performance, staking stats
- **DEX Comparison** — Compare Hyperliquid against Paradex, Lighter, Aster, GRVT, EdgeX, Extended, Variational
- **CEX Comparison** — Compare Hyperliquid against Binance, Bybit, OKX

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐
│   Next.js 14+   │◄───►│   FastAPI Backend     │
│   (Vercel)      │     │   (Railway)           │
│                 │     │                       │
│  React Query    │     │  ┌─────────────────┐  │
│  Recharts       │     │  │ Data Sources    │  │
│  TW Charts      │ WS  │  │ ─ Hyperliquid   │  │
│  Tailwind CSS   │◄───►│  │ ─ CoinGlass     │  │
│  Lucide Icons   │     │  │ ─ CoinGecko     │  │
│                 │     │  │ ─ DeFiLlama     │  │
└─────────────────┘     │  │ ─ Binance       │  │
                        │  │ ─ Bybit         │  │
                        │  │ ─ OKX           │  │
                        │  │ ─ Paradex       │  │
                        │  │ ─ 6 more DEXes  │  │
                        │  └─────────────────┘  │
                        │  Cache │ WS Proxy     │
                        │  Background Tasks     │
                        └──────────────────────┘
```

## Tech Stack

**Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query v5, Recharts, Lightweight Charts, Lucide

**Backend:** Python 3.12+, FastAPI, httpx (async), WebSockets, cachetools, pydantic-settings

**Data Sources:**
- Hyperliquid Info API (native, 50+ endpoints)
- CoinGlass API v4 (Startup tier)
- CoinGecko Pro API (Analyst tier)
- DeFiLlama (free endpoints)
- Binance / Bybit / OKX public APIs
- Paradex / Lighter / Aster / GRVT / EdgeX / Extended / Variational

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env      # Add your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL
npm run dev
```

### Environment Variables

**Backend (.env):**
```
COINGLASS_API_KEY=your_coinglass_key
COINGECKO_API_KEY=your_coingecko_key
CORS_ORIGINS=["http://localhost:3000"]
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

**Frontend → Vercel:**
1. Connect this repo to Vercel
2. Set root directory to `frontend`
3. Set `NEXT_PUBLIC_API_URL` to your Railway backend URL

**Backend → Railway:**
1. Connect this repo to Railway
2. Set root directory to `backend`
3. Add environment variables (API keys, CORS origins)
4. Railway auto-detects the Dockerfile

## API Endpoints

The backend exposes 56 REST endpoints + 7 WebSocket channels:

| Route | Description |
|-------|-------------|
| `/api/overview/*` | KPIs, heatmap, sparklines, large trades |
| `/api/markets/*` | Funding rates, OI, volume, per-asset candles |
| `/api/orderbook/*` | L2 book, depth, spread, large orders |
| `/api/traders/*` | Leaderboard, address lookup, positions, fills |
| `/api/protocol/*` | Fees, revenue, AF, HLP, staking, HYPE |
| `/api/compare/*` | DEX + CEX comparison snapshots & history |
| `/ws/*` | Real-time orderbook, trades, prices, candles |

Full API docs at `/docs` (Swagger) or `/redoc`.

## License

MIT

---

Built by [Zero Knowledge](https://twitter.com/zerokn0wledge_)
