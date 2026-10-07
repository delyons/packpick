# PackPick: project guide for AI assistants

PackPick is an **unofficial** NC State web app. Short quizzes match a student to a **meal plan** and **housing**, show match percentages, and let them save choices to a **profile**. It is not affiliated with NC State; keep the disclaimer in `index.html`.

## Stack and constraints
- Plain HTML, CSS and **native ES modules**. No framework, no bundler, no build step, no runtime dependencies.
- Entry: `index.html` loads `js/main.js` via `<script type="module">`. Modules do not load from `file://`; run `npx serve .`.
- Deployed as a static site on Vercel (preset "Other", no build command). `vercel.json` only sets headers.
- Persistence is `localStorage` only (key `packpick.profile`). No backend, no accounts.
- Tests: `npm test` runs `node --test tests/logic.test.js` (pure logic). UI behavior was verified with Playwright against a local static server.
- Keep UI accessible: focus trap and Escape in the profile overlay, `prefers-reduced-motion` handled in `css/motion.css`, usable at phone width with no horizontal scroll.

## File map
```
index.html            page shell: #app, #overlay (profile dialog), #toast
css/tokens.css        design tokens, light/dark colors
css/base.css          layout and components
css/motion.css        transitions (leave/enter, overlay, toast), reduced-motion
js/main.js            event delegation (click/input/change/keydown), boot: setProfile(loadProfile()); home()
js/state.js           state, profile, ui objects; normProfile/normHist; resetState/resetQuiz
js/format.js          WEEKS = 17, money()
js/dom.js             $app root element
js/data/meal.js       meal plan data, meal quiz questions, top-up and scoring helpers
js/data/housing.js    villages (V), outcomes (H), COST table, question tree (ROOT_H), depth()
js/eligibility.js     YEARS list, ineligible(kind, key) rules
js/flow.js            QUIZZES, getFlow(): builds the question list for the current quiz/answers
js/results.js         mealResult(), housingResult(): ranking, percentages, HTML for results
js/history.js         recordHistory(): last 3 finished quizzes per type
js/persistence.js     persist(), loadProfile() (localStorage, try/catch safe)
js/views.js           navigate() transitions, toast, profile overlay, home/question/result/profile views
js/actions.js         saveOutcome() (from results), saveManual() (from profile dropdowns)
tests/logic.test.js   node:test logic tests
```
Dependency direction (keep it acyclic): `state/format` -> `data` -> `eligibility/flow` -> `results` -> `history/persistence` -> `views` -> `actions` -> `main`.

## State
- `state` (current quiz): `{ view, quiz, step, picks[], attempt }`. `picks` holds each answer by step, so Back keeps earlier choices. It resets only when going home or starting a different quiz (`resetState`/`resetQuiz`).
- `profile` (persisted): `{ meal, housing, year, athlete, history: { meal[], housing[] } }`. It is **one shared object updated in place** (`setProfile` uses `Object.assign`); never reassign it. Always read it through imports.
- `ui`: transient flags (`profileNotice`, `lastSummary`, `overlayOpen`, `lastFocus`, `busy`, `toastTimer`).
- Rendering is string templates written into `$app`; always escape or use trusted static strings. `navigate(update, dir)` animates out, runs `update`, animates in, and clears `ui.busy` in a `finally`.

## Quizzes
### Meal quiz (`js/data/meal.js`, `js/flow.js`)
First question `WHO_MEAL` branches into three flows:
- **First-year**: Dining Dollar slider (`DD_SLIDER`, $10 to $150 a week, step 5) -> meal budget (`MEAL_BUDGET`). Only Flex 500 or Flex 800 are allowed, so scoring compares their effective costs. There is no "where will you eat" question.
- **Athlete**: `ATH_Q` questions over the Athletic plans (`ath50/80/120/150`).
- **Returning/transfer**: `RET_QS` (living situation, meal habits, weekly Dining Dollar target, budget) ranked by `rankReturning(picks)` over Flex, Block and Commuter plans (Commuter only if not living in a hall).

Plans live in `MEAL` (2026-27 per-semester prices before tax, included Dining Dollars `dd`, meals per week cap `cap`).

### Dining Dollar top-up model
Dining Dollars can be topped up later; dining-hall meals (swipes) cannot. So:
- target per semester = weekly Dining Dollars x `WEEKS` (17)
- `topUpFor(key, d)` = max(0, target - plan's `dd`), rounded **up to the next $5**
- effective cost = plan price + top-up
- `withTop(key, d)` builds labels like `Block 60 + $700 top up`; use it anywhere a plan name is shown for a quiz result, history row, or profile entry.
Swipe shortfalls are hard limits (a plan with too few meals is penalized heavily); Dining Dollar shortfalls only add cost.

### Scoring and percentages (`js/results.js`)
- Each candidate gets a penalty (`pen`) from fit to the answers, plus an over-budget penalty of `12 + (eff - budget) / 25` when a budget is given.
- Percentages use a softmax over penalties with `MATCH_TEMP = 10` (lower makes the winner dominate), a 3% floor, and the top share adjusted so the three shown sum to 100.
- Results show a best match plus two to consider, a "why" explanation, budget notes, and a Back button (answers are kept).

### Housing quiz (`js/data/housing.js`)
Question tree built with node helpers; `ROOT_H` is the root and `depth()` drives the progress counter.
- **First-year**: living-learning village yes/no. Yes -> a few questions narrow to exactly one village (all villages in `V` are reachable outcomes). No -> general housing application. No housing budget question for first-years.
- **Returning**: on campus (residence hall, village, Wolf Village, Wolf Ridge, Western Manor, E.S. King) / off campus (apartment or studio, or at home and commuting) / not sure (questions that resolve to on or off campus). A housing budget question applies here.
- `COST` has projected 2026-27 per-semester rates; `costOf` adds the $150 ResNet fee. `housingResult` shows alternatives within budget.
- Some villages are flagged `unconfirmed` because NC State's current page lists no eligibility; the UI shows a caution. Don't remove those flags without a source.

## Profile and eligibility
- The profile overlay (opened from the icon button, no badge/count) shows saved meal plan (with top-up), housing, a year dropdown, an athlete dropdown, manual plan/housing selectors, and quiz history.
- `ineligible(kind, key)` returns a reason string (or `''`). Rules: first-years may only pick Flex 500/800 and hall/Wolf Village/first-year villages; athletic plans need `athlete === true` (unset athlete status hides them unless already saved); villages follow `VILLAGE_YEARS`; the general application is first-year only.
- Saving from a result (`saveOutcome`) shows a toast; changing dropdowns does not.
- History keeps the **3 most recent** finished quizzes per type (answers + results), keyed by `state.attempt` so re-viewing a result doesn't duplicate it.

## Conventions
- Money: `money(n)` ($ with commas, rounded). Semester prices are before sales tax.
- Add a new meal plan: entry in `MEAL`, then check `ineligible`, `rankReturning` key list, and athlete flow.
- Add a village/housing outcome: `V`/`H` and `COST`, attach it in the question tree, add `VILLAGE_YEARS`/`VILLAGE_MSG` entries if restricted.
- Pricing and eligibility data changes yearly; update `MEAL`, `COST`, and the "2026-27" wording in `index.html` together.
- Don't introduce a build tool, framework or circular imports. After edits, run `npm test`, serve locally, and click through all three quiz flows plus the profile overlay.
