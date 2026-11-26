# Roadmap page and "Next build" board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hard-coded home-page roadmap with one shared list of items, shown as a filterable `/roadmap` page and a kanban `/next` board, editable (create, edit, drag) only under `pnpm dev`.

**Architecture:** All items live in `src/data/roadmap.json`. Pure functions in `src/lib/roadmap.js` validate, filter, summarise and transform the list. Pages import the JSON, so they pre-render like every other page. Under `pnpm dev` only, a Vite plugin accepts `PUT /__roadmap` and rewrites the JSON file. The board and roadmap pages save through it, and you publish by committing and pushing. Production is read-only, so there's no new server code.

**Tech Stack:** React 18, React Router 7, Vite 5 (dev plugin), native HTML5 drag and drop, `node --test` (built into Node 22/24, no new dependency).

**Spec:** the "Design" section below, agreed in conversation on 2026-11-26.

## Design (agreed)

- Item fields: `id`, `title`, `note` (optional), `status`, `build` (only when released), `updated` (YYYY-MM-DD, set on create and on every status change).
- Statuses, in pipeline order: `backlog` "Backlog", `planned` "Planned", `in-dev` "In dev", `in-test` "In test", `ready` "Ready for next build", `released` "Released".
- `/next` board: four columns, Planned · In dev · In test · Ready for next build. Backlog and Released items aren't on the board.
- Dev mode (`import.meta.env.DEV`): "+ New" in Planned, click a card to edit title, note and status or delete it, and drag cards between columns and up or down within a column (desktop mouse drag). Order within a column is the items' order in the file. A "Ship build" button asks for a version and turns every Ready item into Released with that `build`.
- `/roadmap`: every item, with a search box (title and note), status filter chips you can combine, a build filter (for released items), a match count, and newest first (`updated` desc, ties keep file order). In dev mode the same item editor works here too, which is how a Backlog item moves to Planned.
- Home page: the long list becomes a summary (released count, in-progress count, the items now In dev, In test or Ready) linking to `/roadmap` and `/next`.
- Nav, footer and FAQ "Roadmap" links go to `/roadmap`. The footer also gets "Next build" → `/next`.
- Migration: the 21 done phases become `released` with `build: "1.0"`. "Cardio exercises UI/UX fix" becomes `in-test`. The 5 planned phases become `backlog`.

## Global Constraints

- `pnpm` only. No new runtime or dev dependencies. Tests run with `node --test`.
- Named exports, PascalCase components, PropTypes on components with props, lowercase CSS file names (CLAUDE.md).
- Monochrome palette through the `--np-*` variables only, hard corners (`--np-r-sm`, `--np-r`), ink borders, no accent colour (CLAUDE.md).
- Render identically on server and client: touch `window`, `document` and URL query strings only inside effects (CLAUDE.md).
- Editing UI and the `/__roadmap` endpoint exist only in dev: gate the UI on `import.meta.env.DEV` and the plugin on `apply: 'serve'`.
- A new route goes in `src/App.jsx`, `src/routes.js` and the `.htaccess` RewriteRule list, plus `sitemap.xml` and `llms.txt` (CLAUDE.md).
- Limits: title 1–120 characters after trimming, note 0–500 characters.

## Review Focus

1. **Filters from the URL vs. hydration.** `/roadmap?q=audio&status=in-dev` is pre-rendered unfiltered. Reading the query during render would make the browser's first render differ, causing a hydration mismatch. Read `location.search` in an effect after mount (Task 4 manual check).
2. **Hand-edited JSON.** A typo in `roadmap.json` (unknown status, duplicate id, released without `build`) should stop the build with a clear message, not deploy a broken page. `validateRoadmap` runs in `scripts/prerender.js` (Task 1 tests and Task 5 step).
3. **Blank or oversized input on create or edit.** A whitespace-only title is refused with an inline message, and limits are enforced both in the form and again in the dev endpoint (Task 1 and Task 2 tests).
4. **Search text that looks like code or regex** (`c++`, `(`, `*`) and mixed case or extra spaces match as plain case-insensitive substrings and never throw (Task 1 test).
5. **Ship build with nothing Ready, or a bad version** (empty, `v1`, a version already used) is refused with a message and changes nothing (Task 1 test).

---

### Task 1: Data file and pure roadmap logic

**Files:**
- Create: `src/data/roadmap.json`
- Create: `src/lib/roadmap.js`
- Test: `src/lib/roadmap.test.js`
- Modify: `package.json` (add `"test": "node --test \"src/**/*.test.js\" \"scripts/**/*.test.js\""`)

**Interfaces:**
- Produces (all named exports of `src/lib/roadmap.js`):
  - `STATUSES: {id: string, label: string}[]` (pipeline order above), `BOARD_STATUSES = ["planned","in-dev","in-test","ready"]`, `IN_PROGRESS = ["in-dev","in-test","ready"]`, `statusLabel(id) -> string`
  - `validateRoadmap(data) -> string[]` (error messages; empty means valid)
  - `filterItems(items, {query = "", statuses = [], build = ""}) -> items` (empty `statuses` means all)
  - `sortNewestFirst(items) -> items`, `listBuilds(items) -> string[]` (newest version first, numeric compare)
  - `summarize(items) -> {total, released, inProgress, current: items}` (`current` = items in `IN_PROGRESS`)
  - `addItem(items, {title, note, status}, today) -> {items, error}`, `updateItem(items, id, patch, today) -> {items, error}`, `removeItem(items, id) -> items`, `moveItem(items, id, status, beforeId, today) -> items`: puts the item just before `beforeId` in file order, or after the last item with that `status` when `beforeId` is `null` (at the end of the file if none). `updated` changes only when the status changes; a reorder within a column keeps it. `released` is not allowed here (no-op), and neither is `beforeId === id` or a `beforeId` with a different status, `shipBuild(items, version, today) -> {items, error}`
  - `today` is a `"YYYY-MM-DD"` string passed in by callers, so tests are deterministic.
- JSON shape: `{ "items": [ { "id": "r-0001", "title": "...", "note": "", "status": "released", "build": "1.0", "updated": "2026-11-26" } ] }`. New ids are `r-` plus 4 digits, one above the highest existing id.

- [ ] **Step 1: Write the failing tests** in `src/lib/roadmap.test.js` (`node:test` + `node:assert/strict`), using a small fixture rather than the real file except where named:
  - `validateRoadmap accepts the real roadmap.json`: `[]` errors, 27 items, 21 `released` with `build "1.0"`, "Cardio exercises UI/UX fix" is `in-test`, 5 `backlog`.
  - `validateRoadmap reports` unknown status, duplicate id, released without build, build on a non-released item, empty title, title > 120, note > 500: one error each, mentioning the item id.
  - `filterItems` with query `"  AUDIO "` matches "Better audio signals and cues"; query `"c++"`, `"("` and `"*"` return `[]` without throwing; `statuses: ["in-dev","in-test"]` returns only those; `build: "1.0"` returns only released 1.0 items; all three combine with AND.
  - `sortNewestFirst` orders by `updated` desc and keeps file order on ties.
  - `listBuilds` on builds `1.0, 1.10, 1.2` returns `["1.10","1.2","1.0"]`.
  - `summarize` counts match the fixture.
  - `addItem` with title `"   "` returns `error` and unchanged items; a valid add trims, gets the next id and `updated: today`.
  - `moveItem` to another column with `beforeId: null` changes status and `updated` and places it right after that column's last item. With `beforeId` it lands directly before that card. A reorder within the same column changes file order but not `updated`. Moving to `released`, onto itself, or before a card in a different column returns items unchanged.
  - `shipBuild` with no Ready items → error "Nothing is Ready for the next build."; version `""` or `"v1"` → error (must match `/^\d+(\.\d+){0,2}$/`); a version already used → error; otherwise every `ready` becomes `released` with `build` and `updated`, and nothing else changes.

- [ ] **Step 2: Run `pnpm test`.** Expected: FAIL, cannot find `src/lib/roadmap.js`.

- [ ] **Step 3: Create `src/data/roadmap.json`** from `PHASES` in `src/pages/NoPlan.jsx` (same titles and order, statuses per the migration rule, `updated: "2026-11-26"`, ids `r-0001`…`r-0027` in file order). **Then implement `src/lib/roadmap.js`** with the interfaces above. Search uses `String.prototype.includes` on lower-cased, trimmed text. Never build a RegExp from user input.

- [ ] **Step 4: Run `pnpm test`.** Expected: all pass. Then `pnpm lint`: clean.

- [ ] **Step 5: Commit**: `feat: roadmap data file and pure roadmap logic`

### Task 2: Dev-only save endpoint

**Files:**
- Create: `scripts/roadmap-dev-store.js`
- Test: `scripts/roadmap-dev-store.test.js`
- Modify: `vite.config.js` (register `roadmapDevStore()` next to `feedbackDevMock()`)

**Interfaces:**
- Consumes: `validateRoadmap` from Task 1.
- Produces: `parseRoadmapBody(raw: string) -> {status: number, body: object, data?: object}`, and `roadmapDevStore()`, a Vite plugin with `apply: 'serve'` that handles `PUT /__roadmap`. On success it writes `src/data/roadmap.json` as `JSON.stringify(data, null, 2) + "\n"` and replies `200 {ok: true}`. It answers other methods with `405`.

- [ ] **Step 1: Write failing tests** for `parseRoadmapBody`: invalid JSON → `400 {ok:false, error:"invalid_json"}`; body over 1,000,000 characters → `413`; valid JSON failing `validateRoadmap` → `422 {ok:false, error:"invalid_roadmap", details:[...]}`; a valid roadmap → `200` with `data`.
- [ ] **Step 2: Run `pnpm test`.** Expected: FAIL, module not found.
- [ ] **Step 3: Implement** both exports. The plugin reads the body like `feedbackDevMock` does, calls `parseRoadmapBody`, and writes only the fixed path (resolved from the config root). Header comment: dev-only, mirrors nothing in production, never deployed.
- [ ] **Step 4: Run `pnpm test`.** Expected: pass. Then `pnpm dev` and `curl -X PUT localhost:5173/__roadmap -d '{"items":[]}'`: the response is 200 and the file becomes `{"items": []}`. Restore it with `git checkout src/data/roadmap.json`.
- [ ] **Step 5: Commit**: `feat: dev-only endpoint that saves roadmap.json`

### Task 3: Editing state and the item editor

**Files:**
- Create: `src/lib/useRoadmap.js`
- Create: `src/components/RoadmapItemForm.jsx`

**Interfaces:**
- Consumes: Task 1 transforms; `PUT /__roadmap` from Task 2.
- Produces:
  - `useRoadmap() -> {items, editable, error, add(fields), update(id, patch), remove(id), move(id, status, beforeId), ship(version)}`. `editable` is `import.meta.env.DEV`. Each action applies the Task 1 transform (passing today's local date). It returns the transform's `error` string without saving if there is one. Otherwise it sets state, PUTs `{items}` and, on a failed save, restores the previous items and sets `error` to "Couldn't save: is pnpm dev running?".
  - `<RoadmapItemForm item={item|null} defaultStatus onSave(fields) onDelete? onCancel />` with title input (maxLength 120, required), note textarea (maxLength 500), and status `<select>` of all six statuses (Released is only selectable if the item is already released). It shows the error returned by `onSave` inline. Delete asks `window.confirm` first. PropTypes required.

- [ ] **Step 1:** Implement both files (UI glue; their logic is covered by Task 1 tests).
- [ ] **Step 2:** `pnpm lint`: clean. Nothing renders them yet, so verification happens in Tasks 4–5.
- [ ] **Step 3: Commit**: `feat: roadmap editing hook and item form (dev only)`

### Task 4: `/roadmap` page

**Files:**
- Create: `src/pages/Roadmap.jsx`, `src/css/roadmap.css` (shared with Task 5)
- Modify: `src/App.jsx`, `src/routes.js` (title "Roadmap — noplan", description "Everything planned, in progress and released for noplan, with search and filters."), `public/.htaccess` (`feedback|faq|privacy|post|roadmap|next`), `public/sitemap.xml`, `public/llms.txt`

**Interfaces:**
- Consumes: `useRoadmap`, `filterItems`, `sortNewestFirst`, `listBuilds`, `STATUSES`, `statusLabel`, `RoadmapItemForm`.
- Produces: the `Roadmap` named export, plus the CSS classes `np-rm-*` (`np-rm-item`, `np-rm-chip`, `np-rm-chip--on`) that Task 5 reuses for cards.

- [ ] **Step 1:** Build the page: `SiteNav`, heading "Roadmap", search input (label "Search the roadmap"), status chips as toggle buttons with `aria-pressed`, a build `<select>` ("All builds" + `listBuilds`), "N of M items", then the list (title, note, status badge, "Released in 1.0" when released), `SiteFooter`. With no matches it shows "Nothing matches these filters." plus a "Clear filters" button. In dev, "+ New item" and click-to-edit open `RoadmapItemForm`. Filter state syncs to `?q=&status=a,b&build=`: read in a `useEffect` after mount, written with `history.replaceState` on change. It never reads the query during render.
- [ ] **Step 2:** Register the route in all five places.
- [ ] **Step 3: Verify.** `pnpm lint && pnpm test && pnpm build`: the build logs `prerendered /roadmap`, and `grep -c "Cardio exercises UI/UX fix" dist/roadmap.html` ≥ 1. Then `pnpm preview` and open `/roadmap?q=audio&status=backlog`: it shows one item with no hydration warning in the console. Also check that clearing filters empties the query string.
- [ ] **Step 4: Commit**: `feat: /roadmap page with search and filters`

### Task 5: `/next` board

**Files:**
- Create: `src/pages/Board.jsx`
- Modify: `src/App.jsx`, `src/routes.js` (title "Next build — noplan", description "What's planned, in development, in testing and ready for noplan's next build."), `public/sitemap.xml`, `public/llms.txt`, `scripts/prerender.js` (call `validateRoadmap` on the imported JSON before rendering; throw with every message joined if not empty), `src/css/roadmap.css`

**Interfaces:**
- Consumes: `useRoadmap`, `BOARD_STATUSES`, `statusLabel`, `RoadmapItemForm`, Task 4's `np-rm-*` card classes.
- Produces: the `Board` named export.

- [ ] **Step 1:** Build the board: four equal columns (header plus count), stacking to one column at ≤600px. Cards show the title and note. In dev, cards are `draggable`: `dragstart` sets the id in `dataTransfer`, a column's `dragover` calls `preventDefault` and gets a `np-board-col--over` outline, and `drop` calls `move`. Dropping on a card calls `move(id, column, thatCardId)`, which puts it above that card and also reorders within the same column. Dropping on a column's empty space calls `move(id, column, null)`, which puts it at the bottom. While dragging over a card, show a drop line above it (`np-board-card--drop-before`). Dev mode also adds "+ New" in Planned (form with `defaultStatus="planned"`), click-to-edit, and a "Ship build" button that is disabled when nothing is Ready. The button `window.prompt`s for a version and shows the `ship` error if there is one. Read-only visitors see plain cards, plus a line linking to `/roadmap` for everything else.
- [ ] **Step 2:** Add the prerender validation, then check it bites: temporarily set one status to `"done"` in the JSON, run `pnpm build` (it must fail and name the item), then revert.
- [ ] **Step 3: Verify in `pnpm dev`:** create "Test item" → it appears in Planned, and `git diff src/data/roadmap.json` shows it. Drag it through all four columns; `/roadmap` shows the matching status after each move. Drag it above another Planned card and back to the bottom: the order in `roadmap.json` follows, and `updated` doesn't change on those reorders. Ship build "9.9" → the item shows "Released in 9.9" on `/roadmap` and leaves the board. Then revert the JSON. Finally, `pnpm build` contains no `__roadmap` and no "Ship build" (`grep -r "__roadmap\|Ship build" dist` is empty).
- [ ] **Step 4: Commit**: `feat: /next board with dev-only drag, create and ship`

### Task 6: Home summary, links and docs

**Files:**
- Modify: `src/pages/NoPlan.jsx` (delete `PHASES` and `BADGE`; the `#roadmap` section shows `summarize`: "N released · N in progress", the `current` items with status badges, and links "Full roadmap" → `/roadmap` and "Next build" → `/next`. Keep `id="roadmap"` so old `/#roadmap` links still land)
- Modify: `src/components/SiteNav.jsx`, `src/components/SiteFooter.jsx` (Roadmap → `/roadmap` as a `NavLink`/`Link`, footer adds "Next build"), `src/pages/Faq.jsx` (roadmap link → `/roadmap`)
- Modify: `CLAUDE.md` (routes list, the `roadmap.json` + dev-store workflow, "roadmap items mirror the app's `docs/BACKLOG.md`" now points at the JSON), `docs/BACKLOG.md` (remove the `/next` item)

- [ ] **Step 1:** Make the edits. Remove now-unused `.np-phase*` CSS only if nothing else uses it (`grep`).
- [ ] **Step 2: Verify.** `pnpm lint && pnpm test && pnpm build`. `grep -c 'href="/roadmap"' dist/index.html` ≥ 2. The home page in `pnpm preview` shows the summary with "Cardio exercises UI/UX fix" under In test, and the top bar still fits at 390px and 640px (same iframe measurement as before).
- [ ] **Step 3: Commit**: `feat: roadmap summary on home and links to /roadmap and /next`
