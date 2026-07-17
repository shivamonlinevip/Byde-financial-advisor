# Explainable Autonomous Financial Advisor — Backend

An autonomous multi-agent AI system that independently researches investments,
analyzes multiple data sources, makes portfolio decisions, and **explains every
decision transparently**. Built for a hackathon with production-quality,
modular Node.js/Express code.

This is **not a chatbot** — it's a pipeline of specialized agents that reason
over live market data, financial news, and macroeconomic indicators to produce
auditable, explainable portfolio recommendations.

---

## 1. Tech Stack

| Concern        | Choice                                   |
|----------------|-------------------------------------------|
| Runtime/Framework | Node.js + Express.js                  |
| Database       | MongoDB + Mongoose                        |
| Auth           | JWT (access + refresh), bcrypt hashing    |
| Validation     | Joi                                       |
| Logging        | Winston (files) + Morgan (HTTP access log)|
| Security       | Helmet, CORS, express-rate-limit          |
| HTTP client    | Axios                                     |
| Scheduling     | node-cron                                 |
| Docs           | swagger-jsdoc + swagger-ui-express        |

---

## 2. Folder Structure

```
backend/
  src/
    config/            # env config + DB connection
      database/
    controllers/        # thin HTTP handlers
    routes/              # Express routers + Swagger annotations
    middlewares/         # auth, validation, error handling, rate limiting
    models/              # Mongoose schemas
    services/            # business logic (auth, user, market, portfolio, ...)
      external/          # Alpha Vantage, Finnhub, Yahoo Finance, NewsAPI, FRED, RBI
    agents/              # the 6 AI agents + orchestrator
    utils/               # logger, ApiError, catchAsync, cache, tokens
    validators/          # Joi schemas
    jobs/                # node-cron background jobs
    docs/                # swagger spec builder
    public/              # static assets
    uploads/              # file uploads (if any)
    logs/                 # winston log files
  app.js                 # Express app (middleware + routes)
  server.js              # entrypoint (DB connect, cron init, listen)
  package.json
  .env.example
```

---

## 3. Installation

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MongoDB URI, JWT secrets, and (optional) API keys
npm run dev      # nodemon, auto-restarts
# or
npm start        # plain node
```

The server starts on `http://localhost:5000` by default. Swagger docs are
served at `http://localhost:5000/api/docs`.

> **No external API keys?** Every external service (Alpha Vantage, Finnhub,
> Yahoo Finance, NewsAPI, FRED, RBI) has a deterministic mock fallback, so the
> full agent pipeline runs end-to-end even with zero keys configured —
> perfect for a hackathon demo.

---

## 4. Environment Variables

See `.env.example` for the full list. Key ones:

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY`, `NEWSAPI_API_KEY`, `FRED_API_KEY` | Optional live data keys |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting |

---

## 5. API Reference

All endpoints are prefixed with `/api`. Protected endpoints require
`Authorization: Bearer <accessToken>`.

### Authentication
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, receive access token (+ refresh cookie) |
| POST | `/auth/logout` | Invalidate current refresh token |
| POST | `/auth/refresh` | Rotate access/refresh token pair |
| POST | `/auth/forgot-password` | Request a password reset token |
| POST | `/auth/reset-password` | Reset password using a token |

### User
| Method | Path | Description |
|---|---|---|
| GET | `/user/profile` | Get current user's profile |
| PUT | `/user/profile` | Update profile (risk profile, goal, amount, duration) |
| DELETE | `/user/profile` | Delete account |

### Portfolio
| Method | Path | Description |
|---|---|---|
| POST | `/portfolio/analyze` | Run the full agent pipeline, create a new portfolio + recommendation |
| GET | `/portfolio/history` | List past portfolios |
| GET | `/portfolio/latest` | Get most recent portfolio + recommendation |

### Market
| Method | Path | Description |
|---|---|---|
| GET | `/market/stocks?symbols=RELIANCE,TCS` | Latest prices + fundamentals |
| GET | `/market/economy` | Sector performance + macro indicators (US/India) |
| GET | `/market/news` | Recent financial news with sentiment |

### Explainability
| Method | Path | Description |
|---|---|---|
| GET | `/explain/:recommendationId` | Full explanation package |
| GET | `/reasoning/:recommendationId` | Step-by-step reasoning timeline |
| GET | `/decision-tree/:recommendationId` | Decision tree structure |

### Simulation
| Method | Path | Description |
|---|---|---|
| POST | `/simulate` | What-if scenario (`inflation`, `interestRate`, `marketCrash`, `GDPGrowth`) against the latest (or a specified) portfolio |

### Agents
| Method | Path | Description |
|---|---|---|
| POST | `/agents/run` | Manually trigger the full pipeline |
| GET | `/agents/status` | Status of the most recent pipeline run |

Full interactive documentation: **`GET /api/docs`** (Swagger UI).

---

## 6. How the Agents Work

The system runs six independent, single-responsibility agents in a fixed
pipeline (`src/agents/orchestrator.js`). Each agent's JSON output becomes the
next agent's input, and every step is persisted to `DecisionHistory` —
including input, output, reasoning text, confidence score, and duration —
whether it succeeds or throws.

```
Profile Agent
     ↓  (risk profile, goal, horizon, base allocation hint)
Market Research Agent
     ↓  (live prices, fundamentals, sector + macro data)
News Analysis Agent
     ↓  (sentiment counts, net sentiment score)
Risk Assessment Agent
     ↓  (market / company / sector / economic / political risk + overall score)
Portfolio Optimization Agent
     ↓  (final allocation, expected return, alternatives, rejected reasons)
Explainability Agent
     ↓  (data used, reasoning, confidence, sources, tradeoffs, decision tree)
Final Recommendation
```

1. **Profile Agent** — rule-based, deterministic mapping from the user's
   stored risk profile/goal/duration to a base allocation hint (equity/debt/
   gold/cash). High confidence (95) because it involves no external data.

2. **Market Research Agent** — fetches live/near-live stock prices
   (Alpha Vantage), company fundamentals (Finnhub), sector performance
   (Yahoo Finance), and macro indicators (FRED for the US, RBI for India).

3. **News Analysis Agent** — pulls recent financial headlines (NewsAPI),
   classifies each as positive/negative/neutral via keyword scoring, and
   derives a net sentiment score. Confidence scales with how lopsided
   (unambiguous) the sentiment signal is.

4. **Risk Assessment Agent** — combines market + news output into five
   weighted risk factors (market, company, sector, economic, political) and
   an overall 0–100 risk score.

5. **Portfolio Optimization Agent** — tilts the profile's base allocation by
   the computed risk score, estimates expected annualized return, and
   generates two labeled alternative portfolios (conservative / aggressive)
   along with explicit reasons for rejecting each as the primary pick.

6. **Explainability Agent** — the core feature. Aggregates every upstream
   agent's output into one package: `dataUsed`, `sources`, `reasoningTimeline`,
   `tradeoffs`, `alternatives`, `rejected`, and a step-by-step `decisionTree`.

---

## 7. How Explainability Works

Every recommendation stored in MongoDB carries its full provenance. Calling
`GET /api/explain/:recommendationId` returns:

```json
{
  "recommendation": { "...": "portfolio document" },
  "confidence": 82,
  "reason": "Recommending a 55% equity, 30% debt, ... allocation ...",
  "sources": ["Alpha Vantage (live pricing)", "Finnhub (company fundamentals)", "..."],
  "tradeoffs": ["...", "..."],
  "alternatives": [{ "label": "Conservative variant", "...": "..." }],
  "rejected": ["Rejected the aggressive variant because ...", "..."],
  "decisionTree": [
    { "step": 1, "node": "User Profile", "summary": "...", "next": "Market Conditions" },
    { "step": 2, "node": "Market Conditions", "summary": "...", "next": "Economic Indicators" }
  ],
  "reasoningTimeline": [
    { "agent": "ProfileAgent", "reasoning": "...", "confidence": 95 }
  ]
}
```

Nothing is a black box: every number in the final recommendation can be
traced back to a specific agent, a specific reasoning string, and (for
market/news data) a specific external source — all queryable independently
via `/api/decision-tree/:id` and `/api/reasoning/:id`, and permanently logged
in the `DecisionHistory` collection.

---

## 8. Background Jobs (node-cron)

| Job | Schedule | Purpose |
|---|---|---|
| `updateMarketDataJob` | every 15 minutes | Refresh watchlist prices/fundamentals |
| `fetchNewsJob` | every 10 minutes | Refresh financial news + sentiment |
| `recalculatePortfoliosJob` | daily @ 02:00 | Re-run the full pipeline for every user |

---

## 9. Error Handling & Validation

- Every request body is validated with Joi (`src/validators/*`) via a
  reusable `validate(schema, property)` middleware.
- All async controller/service errors are centralized in
  `src/middlewares/errorHandler.js`, returning `{ status, message, stack? }`
  (stack traces only in `development`).
- Custom `ApiError` class provides semantic helpers: `badRequest`,
  `unauthorized`, `forbidden`, `notFound`, `conflict`, `internal`.

---

## 10. Design Notes

- **Clean architecture**: controllers stay thin (parse request → call
  service → shape response); all business logic lives in `services/` and
  `agents/`; models are pure schemas.
- **Explainability by construction**: agents use transparent, auditable
  arithmetic (weighted scores, rule-based tilts) rather than opaque ML
  models, so every output is traceable to inputs — the point of the whole
  system.
- **Resilience**: every external API call is wrapped with retry + caching +
  a deterministic mock fallback, so the demo never breaks due to a missing
  key, rate limit, or network hiccup.
- **Auditability**: `DecisionHistory` captures every single agent execution
  (success or failure) with input/output/reasoning/confidence/duration.

---

## 11. Running the Full Flow (Demo Script)

```bash
# 1. Register
curl -X POST localhost:5000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"SuperSecret1","riskProfile":"moderate","investmentGoal":"wealth_growth","investmentAmount":500000,"investmentDuration":5}'

# 2. Analyze (runs the full 6-agent pipeline)
curl -X POST localhost:5000/api/portfolio/analyze -H "Authorization: Bearer <accessToken>"

# 3. Explain the resulting recommendation
curl localhost:5000/api/explain/<recommendationId> -H "Authorization: Bearer <accessToken>"

# 4. Run a what-if simulation
curl -X POST localhost:5000/api/simulate -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"inflation":6.5,"interestRate":7.5,"marketCrash":false,"GDPGrowth":1.2}'
```
