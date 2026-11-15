# FORM implementation QA and fidelity ledger

## Environment and result

Local development server: http://localhost:5173/ (Vite, bound to 0.0.0.0). `npm run build` passes strict TypeScript and production bundling. npm install audited 70 packages with zero vulnerabilities. No Site registered or published; publication belongs to coordinator.

Browser path: actual Aside Browser controlled directly through `aside repl` (no agent delegation). Read aside-browser SKILL.md and `aside guide` / `aside guide repl` first. Four actual reference destinations were discovered in the user's existing reference-collection tab rather than guessed from their names. Browser plugin is not installed, but Aside was explicitly preferred and available; no Playwright fallback was needed. Snapshot is the primary state evidence. Aside console logs show only Vite connected and React DevTools info, with no warnings/errors. There is meaningful Korean app content and no framework error overlay.

## Functional checks

| Flow | Result and evidence |
| --- | --- |
| Initial desktop | FORM title, 38 exercises, no seeded records/favorites, selected real dumbbell bench press, real animation/instructions/gear |
| Muscle filters | All ten clicked on mobile: chest, back, shoulders, biceps, triceps, abs, quads, hamstrings, glutes, calves; each changes list and detail; reset restores 38 |
| Search | Korean 벤치 프레스 yields one; English plank yields real front plank; unknown/unsatisfied conditions show empty state and reset |
| Equipment intersection | Search bench press → toggle with no gear yields zero → dumbbell alone remains zero → adding bench yields one; proves all required pieces rather than any piece |
| Bodyweight availability | Toggle on with no selected gear retains bodyweight movements; plank remains searchable/selectable |
| Exercise selection | List changes heading, animation movement, instructions, gear and form defaults; mobile selection scrolls to detail |
| Playback | Pause changes button to 재생 and component data-playing to false; 2× yields --ea-duration: 2s; 0.5× selected on mobile; shape fits stage after explicit SVG viewport fix |
| Favorites | Saved dumbbell bench press star, reloaded, favorites filter retained one; removed and empty state appeared; cleaned to [] |
| Desktop records | Saved 4 sets × 12 reps × 15kg dated 2026-11-14; history rendered exact values; reload retained entry; delete removed it and reload left [] |
| Mobile records | Saved plank 3 sets × 2 holds × 0kg, local date 2026-11-15; history explicitly says 1회 20초 유지; reload retained entry; delete and reload left [] |
| Responsive | 1536×1024 desktop and 390×844 mobile; document width equals 390 at mobile; compact header, disclosed filter, scrollable list, stacked detail and wrapping form |
| Accessibility | Named controls, input labels and constraints, pressed state, live count/status, tabs with arrow/Home/End handling, skip link, visible focus and reduced-motion CSS |

Records created for QA were deleted through the UI. Their screenshots are test evidence, not seeded user data. Aside fullPage capture while scrolled produced stitching duplication, so final mobile screenshots use viewport captures instead. Screenshot PNGs are retina (2× CSS resolution).

## Direct concept comparison

Used `view_image` on `form-concept.png` and latest `form-desktop.png`, plus both mobile viewport captures and all four reference screenshots. The concept is 1536×1024; implementation was captured at that exact CSS viewport. Compared six concrete areas:

| Aspect | Concept → implementation | Resolution |
| --- | --- | --- |
| Composition | Header, introductory copy, filter/list/detail rails, selected row and bottom log form | Preserved three rails and open whitespace; slightly wider outer gutters and narrower list provide calmer spacing |
| Palette | True white, graphite, light gray stage, chartreuse active muscles and selection | Locked exact white/ink/accent tokens; no gradients or overlays |
| Typography | Bold Korean heading, quiet English subtitle and small UI chrome | Intentional system Korean sans stack, explicit heading/body/control/caption sizes; no font network dependency |
| Controls | Thin borders, small radii, dark save button, star and pause controls | Preserved; added usable favorites-only control, reset button and real typed form labels |
| Anatomy | Static outlined bench-press person plus secondary anatomy images | Replaced with contracted articulated SVG, graphite filled figure and attached highlighted muscles; no extra static side-body diagrams because no such module was contracted |
| Density and copy | Concept 36 exercises, three illustrative instructions and prechecked gear | Real source dataset has 38, four instructions, actual difficulty/English names; defaults empty gear and no favorites/records as required |

Initial render had intrinsic SVG grid sizing expanding beyond its stage; fixed in UI styles with a definite block SVG viewport, then re-captured and inspected. List symbols were replaced with code-native muscle glyphs matching the concept's human-outline treatment. Record form, extra tips disclosure and unobtrusive simplified-diagram note are functional additions. Header/body copy matches the concept except the task-required additions and real dataset wording listed above. No added hero eyebrow, fake metrics, fake user records or unrelated navigation.

The final implementation faithfully follows the concept's visual system and core composition, with the explicit functional/data/animation differences above. It is not a pixel-identical reproduction of the generated anatomical artwork. No material clipping or horizontal mobile overflow remains. Animation-family simplifications and dataset equipment granularity remain documented in ANIMATION_NOTES.md and DATA_SOURCES.md. Browser-specific behavior beyond Aside Chromium and real physical mobile hardware were not checked.

Additional final checks: sampled all moving SVG transform matrices at 250ms intervals; running frames differed and paused frames were identical. At a 320×740 viewport the document stayed within the viewport (305px scroll width with scrollbar, 320px inner width). Final source formatted using Prettier; strict production build passed again (286.61KB JS / 87.33KB gzip, 18.89KB CSS / 4.80KB gzip). The dev server remains running for coordinator handoff.
