# Growth OS

AI content growth workbench for the written assignment demo.

## What this demonstrates

Growth OS turns the five assignment tasks into one visible workflow:

- **总仪表盘** is the default portfolio dashboard. It consolidates multi-account exposure, engagement, account health, content funnel, and priority actions; clicking an account drills into its Growth Intelligence cockpit.
- **Growth Intelligence** is a dual-role command workbench that combines hotspot discovery, multi-account review, Leader tasks and reports, and benchmark strategy learning (tasks 2, 3, and 4).
- **Viral Remix Studio** breaks down a high-performing post and creates reusable concepts plus an editable draft (task 5).
- **Distribution Optimizer** checks the draft, recommends a publish window, flags risk, and records completion (task 1).

The main demo path is:

`opportunity signal -> account/benchmark reasoning -> content asset -> publish readiness -> action log`

Within Growth Intelligence, tasks 2, 3, and 4 form a visible closed loop:

`hotspot radar -> account diagnosis -> benchmark strategy -> candidate pool -> remix -> distribution -> next daily report`

- **Task 2:** follows or ignores live signals and preserves selected items in a shared candidate pool.
- **Task 3:** diagnoses one to three issues for each managed account, turns Leader guidance into owned actions, and generates a cross-account daily report.
- **Task 4:** learns mechanisms from benchmark accounts, distinguishes reusable patterns from non-copyable expression, blocks high-similarity strategy promotion, and sends low-risk original plans to the candidate pool.

The app runs with structured mock data so it is stable without tokens. The fixtures are shaped like API responses, making it straightforward to replace them with a future `/api/agent` integration.

## Run locally

```bash
pnpm install
pnpm dev:full
```

Open `http://127.0.0.1:4173/`.

`dev:full` starts both the Vite frontend and the Node API server. The API persists runtime state in `server/data/state.json`, runs a background monitor on the configured interval, and exposes health/state endpoints.

For a production-style local run:

```bash
pnpm build
pnpm start
```

Open `http://localhost:8787`.

The dashboard's right-side operating rail can be collapsed and remembers the preference locally. Account connection labels (including `已连接`, `待授权`, `Token 即将过期`, and `数据异常`) are demo states only; no real X OAuth flow or token storage is implemented.

For a production build:

```bash
pnpm build
```

## Deploy to Render

`render.yaml` configures Growth OS as one Render Web Service, so the public site and `/api/*` endpoints run together. The service uses `pnpm install --frozen-lockfile && pnpm build` and starts with `pnpm start`; Render supplies `PORT` and the server listens on `0.0.0.0`.

1. Push this project, including `render.yaml`, to a GitHub, GitLab, or Bitbucket repository.
2. In Render, create a Blueprint from that repository and apply the `growth-os-demo` service.
3. Leave `X_BEARER_TOKEN` and `AI_API_KEY` empty for a fully runnable demo mode, or add them later to enable real integrations.
4. Use `/api/health` as the health check after deployment.

The free Render plan has ephemeral disk storage. For persistent candidate-pool, task, and review state, attach a persistent disk and set `STATE_DIR=/var/data`; the server will store its JSON state at `/var/data/state.json`.

## Live monitoring and X API

The default mode is a local event stream so the full workflow runs without credentials. To enable real X monitoring:

```bash
Copy-Item .env.example .env
# edit .env and set X_BEARER_TOKEN
pnpm dev:full
```

The backend uses the X API v2 recent-search endpoint:

```text
GET https://api.twitter.com/2/tweets/search/recent
```

The public project endpoints are:

```text
GET  /api/health
GET  /api/state
GET  /api/x/status
POST /api/monitor/run       { "mode": "demo" | "x", "query": "optional query" }
POST /api/x/ingest          { "query": "optional query" }
POST /api/monitor/start
POST /api/monitor/stop
GET  /api/agent/status
POST /api/analysis/remix   { "trendId": "quiet-luxury", "forceModel": false }
POST /api/candidates       { "trend": { "id": "...", "title": "..." } }
POST /api/assets
POST /api/actions/complete  { "actionId": "hook" }
GET  /api/growth/daily-report
POST /api/growth/daily-report
POST /api/growth/tasks       { "accountId": "...", "title": "...", "owner": "...", "dueDate": "YYYY-MM-DD", "metric": "..." }
POST /api/growth/tasks/complete { "taskId": "..." }
POST /api/growth/benchmark/promote { "strategyId": "tuesday-night-test" }
```

When `X_BEARER_TOKEN` is absent, `/api/x/status` reports that the system is in demo mode and `/api/x/ingest` returns a clear configuration error instead of fabricating X data.

Remix generation follows the same contract. Without `AI_API_KEY`, the server uses the local rules engine; with `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL`, it calls an OpenAI-compatible chat completion endpoint and validates the structured JSON response before returning it to the UI.

## Design references

The interaction model was informed by public repositories rather than copied from them:

- [Rayyan-Oumlil/WayfairExternship](https://github.com/Rayyan-Oumlil/WayfairExternship): staged trend discovery, competitor monitoring, content generation, and a shared intelligence dashboard.
- [ruturajjena/content-agent-dashboard](https://github.com/ruturajjena/content-agent-dashboard): a shared analytics bundle feeding multiple specialized agent panels.
- [DemandBird/demandbird](https://github.com/DemandBird/demandbird): content lifecycle framing around production, approval, publishing, analytics, and repurposing.
- [yumik20/multi-agent-orchestration](https://github.com/yumik20/multi-agent-orchestration): output contracts, auditability, operator feedback, and explicit operational state.

The demo intentionally keeps the data local and the workflow visible. It does not claim live social API ingestion or real model execution.

## Verify

```bash
pnpm test
pnpm build
```

`pnpm test` covers the Growth Intelligence state operations: legacy-state normalization, Leader-task status flow, daily-report generation, and similarity-gated benchmark strategy promotion.
