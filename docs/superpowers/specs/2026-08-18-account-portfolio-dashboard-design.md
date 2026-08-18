# Account Portfolio Dashboard Design

## Goal

Add a default Executive Dashboard to Growth OS that makes multi-account performance visible at a glance, while preserving Growth Intelligence as the existing operating cockpit for action and diagnosis.

## Information Architecture

The left navigation gains `总仪表盘` as the first, default module. It contains portfolio metrics, seven-day performance trends, a content funnel, account health distribution, and a selectable account management table. The right-side Operating Rail appears only in this module and contains high-priority risk, open Leader tasks, review-queue count, filters, and recent activity.

Selecting an account opens Growth Intelligence focused on that account. The existing modules and their workflows remain unchanged.

## Account Data Model

Each account receives demo metrics during state normalization: impressions, likes, comments, saves, posts, rates, a seven-point trend series, and a display-only X connection state. Connection states are `已连接`, `待授权`, `Token 即将过期`, and `数据异常`.

No OAuth endpoint, token storage, X login, or external credential is introduced. `添加账号` and `连接 X` are demo affordances that explain the future connection step without pretending to authorize an account.

## Dashboard Interaction

- Time range and status filters modify the displayed portfolio data.
- The right rail remembers collapsed state in browser local storage; it defaults collapsed on small screens.
- Account rows and health cards open the existing Growth Intelligence cockpit with that account selected.
- Risk, task, review, and activity entries link to the relevant module or show the appropriate explanatory demo state.

## Acceptance Criteria

- Dashboard is the default route/module and is reachable from the left navigation.
- It displays portfolio totals, account comparison, trends, funnel, health distribution, and account connection states.
- The right rail expands/collapses and the choice persists after refresh.
- Account selection transfers context to Growth Intelligence.
- Demo connection states are clearly labelled and make no external authorization request.
