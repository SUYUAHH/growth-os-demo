# Growth OS Design

## Goal

Build a demonstrable AI content growth workbench that covers all five assignment capabilities through three connected modules: distribution optimization, growth intelligence, and viral-content remix.

## Product Shape

The application is a focused desktop workbench for a content operator. A persistent left navigation switches between the three modules while a shared header shows the active account, date range, and demo state. The main user journey is: identify a relevant opportunity, validate it against account and benchmark signals, produce a content draft, and receive a publish recommendation.

The assignment mapping is explicit in the product model:

- Distribution optimization covers task 1.
- Growth intelligence combines tasks 2, 3, and 4 into one reusable analysis layer.
- Viral remix covers task 5.

## Architecture

Use a Vite React single-page application with local structured data. `src/data/mockData.js` owns account, trend, content, benchmark, and recommendation fixtures. `src/App.jsx` owns only top-level navigation and shared state. Module components render focused views and emit small state updates for actions such as saving a concept or marking a recommendation complete.

The data layer is deliberately shaped like an API response so a future `/api/agent` endpoint can replace fixtures without changing the UI contract. No external social API or model token is required for the first demo.

## Key Interactions

1. On Growth Intelligence, the user filters opportunity signals and selects a trend.
2. The trend detail exposes source signal, audience fit, account gap, and recommended action.
3. The user can send the opportunity to Viral Remix, which pre-fills the working brief.
4. Viral Remix shows structured breakdown, three concepts, and a draft editor.
5. Distribution Optimization evaluates the draft and returns publish timing, hook, CTA, and risk guidance.
6. Completing the recommendation updates the workbench activity feed and visible progress state.

## Visual Direction

Use an editorial operations aesthetic: charcoal navigation, warm paper content canvas, cobalt primary action, and restrained coral warnings. Use dense but legible information blocks, thin borders, short labels, metric bars, and subtle entrance motion. Avoid a chat-first layout, nested cards, and decorative gradients.

## Verification

- `pnpm install` succeeds with the bundled package manager.
- `pnpm build` produces a production bundle.
- The dev server opens the workbench at the local URL.
- Desktop and narrow viewport checks confirm the sidebar, data panels, and action controls do not overlap.
- The three module transitions and the trend-to-remix-to-distribution path are clickable.
