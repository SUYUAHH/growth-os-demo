# Content Category Segmentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将三个演示账号与热点推荐统一改造成生活方式、美食餐饮、旅行户外三类，并让分类贯穿看板、增长情报、候选池和后续内容流程。

**Architecture:** 在 `src/data/mockData.js` 定义稳定的分类字典与分类化账号/热点数据；在 `server/growthEngine.js` 和 `server/store.js` 负责旧状态兼容；在 React 模块中复用分类字段做筛选和默认推荐。候选内容保留来源热点分类，避免下钻时丢失上下文。

**Tech Stack:** React, Vite, Node.js native HTTP, JSON state persistence, Node test runner.

---

### Task 1: Add tested category normalization and recommendation filtering

**Files:**
- Modify: `test/growthEngine.test.js`
- Modify: `server/growthEngine.js`

- [ ] **Step 1: Write failing tests** for three normalized account categories, legacy fallback, and category-filtered trends.
- [ ] **Step 2: Run `pnpm test` and confirm the new imports or assertions fail because the helpers/fields do not exist.**
- [ ] **Step 3: Add category constants, `normalizeCategory`, `filterTrendsByCategory`, and category fallback in `normalizeGrowthState`.**
- [ ] **Step 4: Run `pnpm test` and confirm all category tests pass.**

### Task 2: Rewrite demo data into three overseas-interest verticals

**Files:**
- Modify: `src/data/mockData.js`
- Modify: `server/monitor.js`
- Modify: `server/agentEngine.js`

- [ ] **Step 1: Add category fields to all managed accounts, base trends, benchmark fixtures, and generated live-demo trends.**
- [ ] **Step 2: Rewrite account names, handles, descriptions, issues, signals, and Leader guidance for Lifestyle, Food & Dining, and Travel & Outdoors.**
- [ ] **Step 3: Preserve existing IDs and API shape so saved state and account drill-down remain compatible.**
- [ ] **Step 4: Verify no automotive-only wording remains in the rendered demo data.**

### Task 3: Add category controls to the dashboard and Growth Intelligence

**Files:**
- Modify: `src/modules/Dashboard.jsx`
- Modify: `src/modules/Intelligence.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add account-category filter and category tags to the account table.**
- [ ] **Step 2: Add hotspot category filter buttons and category tags to signal rows.**
- [ ] **Step 3: Default hotspot selection to the active account category, while allowing `全部` to show all categories.**
- [ ] **Step 4: Add responsive styles for category chips and filter controls.**

### Task 4: Preserve category through actions and legacy state

**Files:**
- Modify: `server/index.js`
- Modify: `server/growthEngine.js`
- Modify: `src/modules/Intelligence.jsx`
- Modify: `src/modules/Remix.jsx`

- [ ] **Step 1: Store `category`, `categoryLabel`, and `categoryKey` when adding a trend to the candidate pool.**
- [ ] **Step 2: Carry category from candidate to remix fallback and generated asset payloads.**
- [ ] **Step 3: Ensure old state entries without category fields are normalized before rendering.**

### Task 5: Verify, publish, and redeploy

**Files:**
- Modify: `README.md`
- Sync: public copy at `C:/Users/15967/Documents/Codex/2026-08-17/growth-os-demo-public`

- [ ] **Step 1: Run `pnpm test` and `pnpm build` in the source project.**
- [ ] **Step 2: Copy only tracked source/config/docs changes to the public copy; never copy `node_modules`, `dist`, `.env`, state files, or `work/`.**
- [ ] **Step 3: Run install, test, and build in the public copy.**
- [ ] **Step 4: Commit and push the public copy to `SUYUAHH/growth-os-demo`.**
- [ ] **Step 5: Verify Render serves the new commit and check `/api/health` plus the homepage.**
