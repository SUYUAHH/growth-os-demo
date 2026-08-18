# Growth Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified tasks 2, 3, and 4 Growth Intelligence workbench with persistent Leader tasks, daily reports, and benchmark strategies that enter the candidate pool.

**Architecture:** Add a pure `growthEngine` state module behind small JSON routes, then compose the returned state into focused React sections in the existing Intelligence module. The local stream remains the default data provider and all new records persist through `store.js`.

**Tech Stack:** React, Vite, native Node HTTP server, Node test runner, JSON file persistence.

---

### Task 1: Define and test Growth Intelligence state operations

**Files:**
- Create: `test/growthEngine.test.js`
- Create: `server/growthEngine.js`

- [ ] Write tests for state normalization, creation/completion of a Leader task, daily report generation, and low-risk benchmark strategy promotion.
- [ ] Run `node --test test/growthEngine.test.js` and confirm the missing module causes a red failure.
- [ ] Implement deterministic state helpers without file I/O.
- [ ] Run `node --test test/growthEngine.test.js` and confirm all tests pass.

### Task 2: Persist and expose the workflow

**Files:**
- Modify: `server/store.js`
- Modify: `server/index.js`
- Modify: `package.json`

- [ ] Normalize legacy persisted state on read and persist the newly required collections.
- [ ] Add routes for daily-report generation, Leader-task creation and completion, and benchmark-strategy promotion.
- [ ] Add `pnpm test` using Node's built-in test runner.
- [ ] Run `pnpm test` and exercise each new endpoint through local HTTP requests.

### Task 3: Build the command and review UI

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/modules/Intelligence.jsx`
- Modify: `src/lib/api.js`
- Modify: `src/styles.css`

- [ ] Add a role switch that reorders shared priorities rather than duplicating data.
- [ ] Render today-command metrics, account issue cards, structured Leader tasks, and a daily report trigger.
- [ ] Wire task creation, completion, report generation, and benchmark-strategy promotion to the API.
- [ ] Preserve the existing hotspot/candidate/remix navigation path.

### Task 4: Build the benchmark strategy UI and verify integration

**Files:**
- Modify: `src/modules/Intelligence.jsx`
- Modify: `src/styles.css`
- Modify: `README.md`

- [ ] Render benchmark mechanics, copy boundaries, similarity scores, and differentiated strategy cards.
- [ ] Disable direct promotion for high expression-similarity strategies.
- [ ] Verify a low-risk strategy creates a candidate that appears in the existing pool.
- [ ] Run `pnpm test` and `pnpm build`; document the new demo flow and API endpoints.
