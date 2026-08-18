# Growth Intelligence Design

## Goal

Turn tasks 2, 3, and 4 into one Growth Intelligence workbench that supports daily operator work and Leader decisions. The workbench must lead from discovered signals to differentiated content candidates, with an auditable human-control layer.

## Product Structure

The Growth Intelligence page has a dual-role command header and three explicit task sections:

1. Hotspot Radar (task 2): live or manually supplied content signals, follow/ignore decisions, and a candidate content pool.
2. Multi-account Review (task 3): three managed accounts, one to three evidence-backed issues per account, a Leader brief, structured tasks, and a daily report.
3. Benchmark Strategy (task 4): three to five benchmark accounts, reusable mechanisms, non-copyable boundaries, differentiated ideas, similarity risk, and a route into the candidate pool.

The role switch changes the ordering and emphasis of a shared dataset. Operator view prioritizes today's work; Leader view prioritizes risk, ownership, and improvement progress.

## Data and Decision Flow

```text
Signal stream / manual post import / future X API
  -> hotspot evaluation
  -> account diagnosis + benchmark mechanism analysis
  -> differentiated strategy
  -> candidate pool
  -> remix and distribution modules
  -> post-publication metrics
  -> next daily report and strategy adjustment
```

Every candidate stores its source signal or benchmark strategy. Every Leader task stores account, owner, due date, status, expected metric, and later outcome. The activity log records human overrides and automation results.

## Backend Boundaries

`server/growthEngine.js` contains deterministic, testable state operations:

- normalizing legacy state into the new Growth Intelligence shape;
- creating and completing Leader tasks;
- generating a per-account and overall daily report;
- validating benchmark strategies and creating candidates from approved strategies.

`server/index.js` exposes these operations through JSON endpoints. `server/store.js` persists the returned state. No model or social-network credential is needed in demo mode.

## Human Controls and Safety

- An operator can follow, ignore, or restore a hotspot candidate.
- Leader tasks are explicit and may be completed only through a user action.
- Account diagnoses can be amended in the interface while preserving an activity entry.
- Benchmark mechanisms are reusable, but high expression-similarity strategies are blocked from direct candidate creation.
- Publication remains an approval step; this feature does not automatically post to a social platform.

## Demo and Real Data Modes

Demo mode is the default and uses the existing changing local event stream plus seeded account and benchmark data. Operators can subsequently add accounts or paste/import posts through the same API shape. When X credentials are present, ingestion changes source only; the diagnosis and strategy flow stay unchanged.

## Acceptance Criteria

- The page visibly labels and covers tasks 2, 3, and 4.
- Each of three managed accounts shows one to three issues, evidence, priority, and a next action.
- A daily report includes overall score, priority issues, task progress, and improvement assessment.
- Benchmark analysis distinguishes reusable mechanisms from non-copyable expression and displays similarity risk.
- A low-risk benchmark strategy can create a candidate that appears in the existing candidate pool.
- All state-changing actions persist in `server/data/state.json` and appear after refresh.
