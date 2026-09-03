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
# Growth OS

Growth OS 是一个本地可运行的内容运营工作台。当前演示以结构化模拟数据为主，保留 X API 接口位置；未接入真实 X OAuth 或生产 Token。

## 当前工作流

1. 在“增长情报”中抓取关键词或对标账号内容，查看粉丝量、点赞率、评论、发布时间和热点标签。
2. 将内容收录到候选池，可分配给具体账号；账号候选池与总候选池共用同一条记录。
3. 在“爆款拆解”中查看原帖素材、内容质量检查，并用规则知识库保存通过、建议修改或人工确认记录。
4. 在“内容资产”中生成中文标题、正文、CTA、素材建议和 AI 图片提示词；完成人工确认后才可进入待发布。

自动发布不在演示范围内。发布仍由运营人员人工确认和执行，避免多账号场景中的风控误判。

## 本轮业务优化

- 抓取内容标注数据可信度（Demo 数据 / 部分真实 / 真实数据），并保留粉丝、点赞率、评论、转发、发布时间和素材。
- 候选池继续区分总池、账号池和未分配池；收录时按内容分类自动路由，并可按状态、分类、标签和指标排序。
- 账号画像补充目标人群、内容支柱、内容禁区和账号时区，健康度规则库保留良好、预警和对应动作。
- 内容资产保留 V1 AI 初稿等版本信息；发布状态会生成平台、账号、时间、操作人和链接组成的发布记录。
- 发布后复盘支持评论意图摘要和下一轮实验计划，包含目标、变量、对照、变体、样本量和观察指标。
- X、TikTok、Instagram、小红书分别使用平台规则库；规则检查只提供决策依据，最终发布仍需人工确认。

本轮仍明确区分 Demo 展示和真实能力：没有 X OAuth、真实账号授权或自动发布时，页面会显示本地 Demo 数据，后续可通过现有 API 接口接入。

## 三轮业务升级说明

本轮按企业内容运营视角完成三轮升级：

1. 规则层：平台目标与内容类型、X 曝光量缺失时的数据可信度、广告/Affiliate 披露、健康/金融声明、隐私、素材权利和 AI 内容标识进入合规闸门。
2. 决策层：候选内容会给出下一步动作和资产化门槛；发布结果支持按平台、账号和标签横向比较，避免只看单条内容的虚荣指标。
3. 运营层：账号画像、版本与发布记录、原帖证据、复盘实验计划、平台规则抽屉和二面演示脚本形成统一的可解释工作流。

业务判断遵循“信号发现 → 账号匹配 → 平台检查 → 人工确认 → 发布记录 → 结果回流 → 下一轮实验”的链路。平台规则为 Demo 版可解释规则，不替代平台官方政策或法务审查；生产接入时应把官方政策链接、规则版本和地区合规要求作为知识库来源。

## AI 出海增长视角

总仪表盘现在额外演示产品增长漏斗（访问、注册、激活、D7 留存、付费）、北美/欧洲/东南亚/日韩市场策略、海外 KOL 合作池、内容到产品的渠道归因和 AI 增长实验。注册、激活、留存和付费在当前版本使用结构化 Demo 数据；真实产品数据应通过统一用户标识、UTM 和产品埋点接入，不把社媒互动直接等同于商业转化。
