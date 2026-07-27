# 002 — Design System

ONN uses a dense, precise infrastructure interface inspired by developer platforms. Data, system state, processing, and relationships dominate; decorative consumer-news patterns do not.

## Tokens

- Background `#071018`; surface `#102033`; elevated surface `#0B1723`
- Primary `#00AEEF`; secondary `#4A90E2`; accent `#38BDF8`
- Success `#00C853`; warning `#FFC107`; danger `#FF5252`
- Text `#F5F8FC`; muted `#90A4B8`; border `#23384F`
- Inter for UI, Space Grotesk for display, JetBrains Mono for code/keys
- Compact 6–10px radii, fine borders, restrained shadows, 4/8/12/16/24/32px spacing rhythm

## Components and layout

The app shell combines a persistent desktop sidebar, compact header controls, reusable panels, metric cards, status rows, timelines, charts, processing stages, data tables, form controls, API-key displays, and graph canvases. Dense grids preserve hierarchy and avoid oversized cards.

Desktop dashboards use 6-column metrics and two/three-column analysis areas. Tablets reduce columns; mobile uses a drawer, stacked grids, scrollable tables/pipelines, contained charts, and reachable actions.

Motion communicates state or processing only, uses short restrained transitions, and respects reduced-motion preferences. Accessibility requires landmarks, keyboard navigation, visible focus, text alternatives for charts/graphs, semantic controls, sufficient contrast, and status labels in addition to color.

Dashboard data must be identified as demonstration, empty, or operational. Never imply that a planned service is live.
