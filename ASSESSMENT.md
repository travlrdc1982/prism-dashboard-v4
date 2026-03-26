# PRISM Dashboard v4 - Assessment & Recommendations

## Overview

The **PRISM Dashboard v4** is a React-based Audience Intelligence Platform that visualizes political audience segmentation data across 16 segments (10 GOP, 6 DEM). It provides four views: an interactive segment bubble map, ROI analysis grid, message preference heatmap, and detailed segment profiles with demographics, trust metrics, ideology, wellness/media consumption, and persona narratives.

**Tech stack:** React 19 + React Router 7 + Vite 7, deployed on Vercel. Zero external UI/charting libraries -- all visualization is hand-built with inline styles and SVG.

**Codebase:** ~6,200 lines across 16 files. The two largest files are `SegmentProfile.jsx` (2,156 lines) and `studyData.js` (1,871 lines).

---

## Architecture Assessment

### Strengths

1. **Zero-dependency visualization.** All charts (bubble map, donut charts, stacked bars, heatmaps) are implemented with raw SVG and CSS. This eliminates charting library overhead and gives full control over the visual language. For a dashboard of this complexity, it's a surprisingly lean dependency tree (only `react`, `react-dom`, `react-router-dom`).

2. **Cohesive design system.** The dark-theme design (`theme.js`) with consistent typography (JetBrains Mono for data, Nunito for UI) and color semantics (party colors, tier colors, trust colors) creates a professional, unified appearance.

3. **Clean routing architecture.** The `App.jsx` > `Shell.jsx` > pages pattern is simple and effective. The Shell provides a sticky header with navigation and a consistent layout wrapper. The four routes map clearly to distinct analytical views.

4. **Rich data visualization.** The dashboard packs substantial analytical depth: ROI scoring with composite metrics, persuadability breakdowns, pre/post delta tracking, Share of Preference heatmaps with sortable columns, and multi-tab segment profiles spanning demographics, ideology, trust, experiential data, wellness practices, and media consumption.

5. **Interactive design.** The bubble map's click-to-select with persona card overlay, double-click to navigate to profile, and click-outside-to-dismiss is intuitive. The heatmap's row/column hover highlighting with crosshair effect is well-implemented.

### Issues

#### Critical

1. **Massive data duplication across files.** Segment data is defined in at least **4 separate places**:
   - `src/data/segments.js` (132 lines -- full segment definitions with personas)
   - `src/data/studyData.js` (1,871 lines -- study-specific metrics and messages)
   - `src/pages/SegmentProfile.jsx` (lines 6-170 -- complete segment re-definition with all demos/personas)
   - `src/pages/SegmentMap.jsx` (lines 5-22 -- bubble coordinates and population)
   - `src/pages/IdeologyHeatmap.jsx` (lines 4-21 -- segment names/parties)

   This means any segment data change must be replicated across 3-5 files. Drift between copies is virtually certain. For example, `segments.js` uses `pop: 0.02` (decimal) while `SegmentProfile.jsx` and `SegmentMap.jsx` use `pop: 2` (integer percentage) for the same segment.

2. **`SegmentProfile.jsx` is 2,156 lines -- a single monolithic component.** It contains:
   - Complete segment data definitions (170+ lines)
   - Study ROI data duplicated from `studyData.js`
   - 7 sub-panel components (`DemographicsPanel`, `BeliefsPanel`, `TrustPanel`, `ExpPanel`, `WellnessPanel`, `MediaPanel`, `IdeologyHeatmap`)
   - Inline data arrays for beliefs, trust entities, experiential metrics, wellness data, and media consumption
   - All visualization components (MiniDonut, bar charts, heatmap cells)

   This file is responsible for far too much. It's difficult to navigate, test, or modify safely.

3. **All styling is inline.** Every component uses `style={{...}}` objects with raw values. There is no CSS-in-JS library, no CSS modules, no utility classes. This means:
   - No hover/focus/active pseudo-class support (except via JS state)
   - No media queries for responsive design
   - No style reuse -- the same `fontFamily:"'JetBrains Mono',monospace"` string appears 100+ times
   - No animation keyframes

4. **No responsive design.** The dashboard assumes a desktop viewport. There are no breakpoints, no responsive layout adjustments, and fixed pixel widths throughout (e.g., `maxWidth: 1400`, `width: 62`, `minWidth: 68`). The heatmap table and ROI grid will be unusable on tablets or smaller screens.

#### Significant

5. **`AudienceROI.jsx` defines its own color palette** (`const C = {...}`) that partially overlaps with but diverges from `theme.js`. For example:
   - `theme.js`: `partyGOP: "#ef4444"`, `partyDEM: "#3b82f6"`
   - `AudienceROI.jsx`: `gop: "#e57373"`, `dem: "#64b5f6"`
   - `SegmentMap.jsx`: `DEM_FILL: "#2563eb"`, `GOP_FILL: "#dc2626"`

   Three different blue and three different red for the same party colors across three pages.

6. **No loading states, error boundaries, or fallback UI.** If `studyData.js` has a malformed entry, or a segment code in the URL doesn't exist, the page will crash with a white screen. There is no `ErrorBoundary` component or graceful fallback.

7. **Data files contain mixed concerns.** `segments.js` has static template data, `studyData.js` has study-specific metrics, but `SegmentProfile.jsx` re-defines everything inline. The data architecture intent (static template vs. study-specific) is sound but the execution breaks down because pages don't consistently import from the data layer.

8. **Google Fonts loaded via `<link>` tag inside JSX.** In `Shell.jsx` (line 14-17), a `<link>` element loads 7 font families directly in the component render. This should be in `index.html` or imported via CSS. The current approach re-inserts the tag on every render (React deduplicates, but it's not idiomatic).

9. **`MessageMap.jsx` reads `DATA.segments` at module level** (line 5: `const SEGMENTS = DATA.segments`) but the study toggle switches between `DATA.ESI.messages` and `DATA.MA.messages`. The segment column headers don't update when switching studies -- they always show the top-level segments regardless of which study is selected.

10. **Unused page component.** `IdeologyHeatmap.jsx` is not routed directly in `App.jsx` -- it's only imported as a sub-component within `SegmentProfile.jsx`. Despite being in the `/pages` directory, it functions as a reusable component, which is misleading.

#### Minor

11. **Mixed casing in image file extensions.** Some persona card images use `.PNG` and others `.png` (e.g., `CECCard.PNG` vs `UCPCard.png`). This works on case-insensitive filesystems but will break on Linux servers.

12. **No `README.md` content beyond the Vite default.** The current README has no project-specific documentation.

13. **`package.json` version is `0.0.0`.** Not tagged for release.

14. **No tests.** Zero test files, no testing framework configured.

15. **No linting in CI.** ESLint is configured but there's no CI pipeline to enforce it.

---

## Recommendations

### Priority 1: Data Architecture (High Impact, Moderate Effort)

1. **Create a single source of truth for segment data.** Consolidate all segment definitions into one canonical file (e.g., `src/data/segments.js`). All pages should import from this file. Eliminate the inline re-definitions in `SegmentProfile.jsx`, `SegmentMap.jsx`, and `IdeologyHeatmap.jsx`.

2. **Normalize the data model.** Decide on a consistent format: population as decimal (0.02) or integer (2), and standardize everywhere. Create a single `getSegment(code)` lookup function used across all pages.

3. **Separate bubble layout data from segment data.** The `SegmentMap.jsx` bubble coordinates (`left`, `top`, `w`, `z`) are layout-specific and belong in their own map keyed by segment code, merged at render time.

### Priority 2: Component Decomposition (High Impact, Moderate Effort)

4. **Break up `SegmentProfile.jsx`.** Extract sub-panels into their own files:
   ```
   src/components/profile/DemographicsPanel.jsx
   src/components/profile/BeliefsPanel.jsx
   src/components/profile/TrustPanel.jsx
   src/components/profile/ExpPanel.jsx
   src/components/profile/WellnessPanel.jsx
   src/components/profile/MediaPanel.jsx
   ```
   The main `SegmentProfile.jsx` should only handle segment selection, tab state, and layout.

5. **Extract shared visualization components.** `MiniDonut`, `PBar` (persuadability bar), and `DeltaBar` are used in multiple places. Move them to `src/components/charts/`.

6. **Move `IdeologyHeatmap.jsx`** from `pages/` to `components/profile/` to reflect its actual usage as a sub-component.

### Priority 3: Design System Consolidation (Medium Impact, Low Effort)

7. **Unify color definitions.** Remove the local `C` palette in `AudienceROI.jsx` and the local color constants in `SegmentMap.jsx` and `MessageMap.jsx`. All pages should import from `theme.js`. If page-specific colors are needed, extend the theme rather than redefining.

8. **Create reusable style constants.** Extract repeated patterns like the JetBrains Mono font stack, common padding/gap values, and card border styles into shared objects in `theme.js`:
   ```js
   export const STYLES = {
     monoText: { fontFamily: MONO, fontWeight: 700 },
     card: { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 8 },
   };
   ```

9. **Move font loading to `index.html`.** Remove the `<link>` tag from `Shell.jsx` and add it to the `<head>` in `index.html` where it belongs.

### Priority 4: Robustness (Medium Impact, Low Effort)

10. **Add an error boundary.** Wrap the `<Outlet>` in `Shell.jsx` with a React error boundary that shows a friendly message instead of a white screen.

11. **Validate segment code from URL.** In `SegmentProfile.jsx`, handle the case where `?seg=INVALID` is passed. Currently this would cause a crash on `.persona.quote` access.

12. **Normalize image file extensions.** Rename all `.PNG` files to `.png` for Linux compatibility.

### Priority 5: Future Improvements (Lower Priority)

13. **Add basic responsive design.** At minimum, add horizontal scrolling with a fixed left column for the ROI grid and heatmap on smaller screens. The bubble map already scales via `viewBox` which is good.

14. **Consider CSS Modules or a utility framework.** The inline style approach becomes increasingly painful as the codebase grows. CSS Modules would keep styles co-located while enabling pseudo-classes, media queries, and deduplication.

15. **Add a testing foundation.** Install Vitest (natural fit with Vite) and write tests for:
    - Data integrity (all segments have required fields, population sums check)
    - Component rendering (each page renders without crashing)
    - Navigation (clicking a bubble navigates to the correct profile)

16. **Automate the data pipeline.** `studyData.js` has a header saying `Run: python convert_data.py MAESIDashboardData.xlsx` but this script is not in the repository. Include it so data updates are reproducible.

17. **Add a CI pipeline.** A simple GitHub Actions workflow that runs `npm run lint` and `npm run build` on PRs would catch regressions early.

---

## Summary

The PRISM Dashboard is a visually polished and analytically rich application built with impressive economy -- just 3 runtime dependencies and ~6,200 lines of code. The core visualizations are well-designed and the user experience is cohesive.

The primary technical debt is **data duplication** (segment definitions spread across 4-5 files) and **component bloat** (a single 2,156-line profile page). These create real maintenance risk: any data change requires coordinated edits across multiple files, and the profile page is difficult to reason about or modify safely.

The recommended focus is:
1. **Consolidate data** into a single source of truth
2. **Decompose SegmentProfile.jsx** into focused sub-components
3. **Unify the design system** so all pages use consistent colors from `theme.js`

These three changes would dramatically improve maintainability without requiring a rewrite.
