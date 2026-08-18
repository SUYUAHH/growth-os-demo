# Account Portfolio Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default portfolio dashboard and visual account-management view with a persistent, collapsible operating rail.

**Architecture:** Extend normalized account records with deterministic demo metrics and aggregate them in a pure server helper. Render the portfolio in a new React module and use the existing Growth Intelligence module for account-level operational drilldown.

**Tech Stack:** React, Vite, native Node HTTP server, JSON persistence, Node test runner.

---

### Task 1: Add tested portfolio aggregation

**Files:**
- Modify: `test/growthEngine.test.js`
- Modify: `server/growthEngine.js`

- [ ] Write a failing test for `buildAccountPortfolio`, asserting three connection-state buckets, aggregate impressions, average like/engagement rates, and health counts.
- [ ] Run `node --test test/growthEngine.test.js` and observe the missing export failure.
- [ ] Add normalized demo metrics and `buildAccountPortfolio(state)` with no file I/O.
- [ ] Run `node --test test/growthEngine.test.js` and confirm every test passes.

### Task 2: Create the dashboard module

**Files:**
- Create: `src/modules/Dashboard.jsx`
- Modify: `src/App.jsx`
- Modify: `src/data/mockData.js`
- Modify: `src/styles.css`

- [ ] Add `总仪表盘` as the first navigation item and default active module.
- [ ] Render portfolio metrics, sparkline trends, content funnel, health distribution, account comparison table, and demo connection states.
- [ ] Add a right Operating Rail with local-storage-backed collapse state and responsive behavior.
- [ ] Route selected accounts into the existing Growth Intelligence view.

### Task 3: Document and verify

**Files:**
- Modify: `README.md`

- [ ] Document dashboard scope and the non-OAuth connection-state limitation.
- [ ] Run `pnpm test`, `pnpm build`, and a local state/API check that verifies portfolio metrics are present.
