# FORM design specification

Primary concept: `form-concept.png` (1536×1024), generated with the built-in imagegen tool before implementation. The full-screen prompt requested a Korean exercise library, a white three-column workspace, graphite typography, chartreuse muscle accents, all muscle and equipment filters, selectable exercise list, anatomical playback stage, Korean instructions and workout form. No raster UI is shipped.

## Tokens and composition

True white #ffffff page; ink #181b20; secondary #70757e; surface #f6f7f8; border #e7e9ec; accent #c5ee57; selection #f2f9df. No gradients or overlays. Sans system Korean stack, headline 32/1.4 700, detail 27/1.3 700, body 14/1.6, controls 13/1.4, captions 12. Radius 8–12px; restrained hairline panels; no shadows. Spacing 4/8/12/16/24/32. Header 64px; outer desktop margin 32px; filter/list/detail widths 208/340/flexible. List rows 76px and scroll within a rail. Simple 18px outline icons with 1.7px strokes; stars fill only when favorited. Native code F mark and wordmark.

Copy: FORM; 운동 라이브러리; 운동 기록; 나의 페이스로, 정확한 움직임; 움직임을 이해하고, 나만의 폼을 만들어요.; 부위별 운동을 찾아 정확한 동작과 핵심 근육을 확인하고, 나만의 운동 기록을 남겨보세요.; 운동 부위; 사용 가능한 기구; 내 기구로만 보기; 운동 이름 검색; 운동 방법; 운동 기록; 사용 기구; 세트; 반복 횟수; 무게 (kg); 날짜; 기록 저장. Exercise copy comes from the contracted dataset. No seeded favorites or workout records.

## Components and responsive plan

App composes FilterPanel, ExerciseList, ExerciseDetail, WorkoutForm and WorkoutHistory; local storage hook keeps versioned data. On mobile, filters disclose above the list, list has a bounded scroll area and detail follows below. Required actions keep visible text or accessible names. Functional empty states have reset. Selection and controls transition 140ms; detail fades 180ms; reduced motion disables transitions. No decorative motion.

## Actual references inspected with Aside

The user's open reference collection at https://imjw0826.github.io/post.html?slug=design-references provided exact destinations, resolving ambiguity in Arc/Affect naming:
- https://transitions.dev/ — inspected library categories and animation triggers: purposeful shared motion tokens, quiet state changes.
- https://ui.shadcn.com/ — inspected live outline/secondary buttons, radio, checkbox, switches, fields and sidebar examples: clean bordered controls and readable hierarchy.
- https://uiarc.dev/ — actual Arc UI destination from user's collection; inspected keyboard-support/quiet-motion core components and component/block hierarchy.
- https://www.affectui.com/ — actual Affect UI destination; inspected tabbed library and screen controls and reduced-motion documentation link. Agent-specific controls are unrelated to this app and are not copied.

These are visual/interaction references, not claims that paid library source was installed or copied.

## Intentional implementation differences

The contracted live SVG animation replaces the concept's static anatomical drawing and may differ in pose/detail. All ten muscle filters and all eight equipment kinds must be present even where the concept shortened labels or omitted machine. The rendered number of exercises comes from real data rather than the concept's illustrative 36. Date defaults to local today, with blank history and favorites. Equipment defaults empty with filtering disabled, rather than concept's prechecked dumbbell/bench. These changes satisfy the task's functional contract.

## Final fidelity additions

Implementation thumbnails use small outlined human muscle glyphs rather than dumbbell icons. Controls include an explicit favorites-only filter and reset, tips disclosure, a record heading/status and an unobtrusive educational-diagram caption requested at integration. All are functional additions absent from the initial image. The log supports plank duration semantics (one repetition means a 20-second hold). `QA.md` records the direct six-point comparison and actual verification limits; this is a faithful design-system implementation, not a pixel-identical redraw of generated anatomy.
