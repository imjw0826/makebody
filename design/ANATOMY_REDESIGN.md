# Anatomy GIF redesign

References re-opened directly in Aside on November 15, 2026: transitions.dev, ui.shadcn.com, uiarc.dev, affectui.com. No paid source copied.

- shadcn: grayscale controls, pill buttons, fine boundaries and visible focus.
- Arc: compact navigation rail, keyboard-friendly controls and quiet motion.
- affectUI: clear segmented selected tabs and orderly detail hierarchy.
- transitions.dev: short purposeful selection transitions with reduced-motion handling.

Concept: form-anatomy-concept.png. True white, ink #181b20, light gray #f5f5f5, lime #c5ee57 selection, red #df483d working muscles. Header64, 190/330/flexible columns, anatomy stage390, compact rounded navigation, borderless filter rail, illustrated thumbnails, primary/secondary muscle chips, segmented detail tabs, playback and download, numbered technique and workout form.

Required departures from the visual concept: preserve all ten actual muscle categories and exact exercise records, rather than the concept's merged filters; use a single moving anatomical figure, instead of two static poses; use actual duration frames and initial empty workout records, rather than concept sample values. A timeline at the bottom of the illustration seeks actual frames.

Allowed copy changes: replace the intro subtitle with 근육의 움직임을 보고, 정확한 자세로 운동하세요.; replace photo captions with 근육을 강조한 동작 애니메이션; add 주동근/보조근 chips, 강조 근육 legend and GIF 저장. Existing names, navigation, methods and forms are retained.

## Verification and fidelity review

Aside browser: 1536×1024 desktop, 900×1000 tablet, 390×844 mobile. `view_image` reviewed the generated concept and the final rendered desktop/mobile captures in the same QA pass.

| Aspect | Rendered result |
| --- | --- |
| Layout | Filter rail, illustrated list and wide animation panel retained; selected exercise scrolls into its own list without moving the page |
| Palette | White/graphite/gray controls, pale lime selection, red working muscles; no photographic images |
| Typography | Clear Korean headings, subdued English names, compact control and form labels |
| Components | Rounded navigation, dark playback button, segmented detail tabs, bordered search and quiet selected rows |
| Asset treatment | Full-body grayscale drawn GIF frames, preserved white background and aspect ratio; illustrated static thumbnails |
| Responsive | Mobile navigation wraps into its own complete row; collapsible filters; no horizontal overflow; tablet retains equipment controls |
| Motion and controls | Running frames changed; paused canvas pixels remained identical across repeated samples; timeline selected frame6; 2× option reads actual value2; original download returned image/gif and GIF89a |

Above-the-fold copy uses the recorded allowed changes. Functional differences from the generated concept remain intentional: the real catalogue and controls are kept, one figure animates rather than showing two still poses, and the original workout form is below the technique section instead of replacing fields with concept sample data. The final implementation was visually checked against this design system; no clipping, missing media, blank app, framework overlay, or relevant console errors were seen. Device testing used Aside Chromium, not physical mobile hardware.

`npm run check:media`: 107 genuine GIFs, 1,276 frames, all atlases and posters. `npm run build`: strict TypeScript and production build passed.
