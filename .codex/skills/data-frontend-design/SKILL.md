---
name: data-frontend-design
description: Design or refine the Data Lab frontend when working on dashboards, upload flows, data tables, data states, or responsive visual hierarchy in Astro and Tailwind CSS.
---

# Data frontend design

Build calm, legible interfaces that help people understand a dataset before asking them to act on it. Preserve the local dark Data Lab visual language unless the request asks for a redesign.

## Product context

- The application receives CSV and XLSX files and exposes rows, columns, missing values, previews, and numeric statistics.
- Treat an import as a short workflow: explain accepted formats before selection, communicate processing while waiting, then make the analysis easy to scan.
- The backend is the source of truth. Do not invent metrics that the API does not return.

## Design decisions

- Start with the user decision each area supports. Give headline metrics, tables, and empty/error states a clear purpose.
- Use hierarchy through spacing, grouping, typography, and restrained color. Teal identifies primary actions and positive active states; reserve destructive colors for failures.
- Keep tables usable on narrow screens: retain semantic table markup, allow horizontal scrolling, and avoid hiding essential values without an alternative.
- Keep copy in Brazilian Portuguese, concrete, and concise. State what happened and the next viable action.
- Prefer Tailwind utilities and existing global tokens. Add CSS only when it represents a reusable visual rule rather than a one-off workaround.

## Interaction and accessibility

- Use native controls and visible labels. Associate help and error text through `aria-describedby` where useful.
- Announce asynchronous status changes with an appropriate live region; disable only the control that must wait.
- Ensure every keyboard focus state is visible and primary actions remain understandable without color alone.
- Design all four states when they are relevant: initial, loading, success with data, and recoverable error.

## Completion

Run `npm run check` and `npm run build` after frontend changes. When an interaction changes, manually exercise the local page with a valid sample and an invalid upload.