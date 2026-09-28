# Data Analysis Monorepo

## Frontend ownership

The web application lives in `apps/web` and uses TanStack Start with React, Vite and Tailwind CSS 4. Use `$data-frontend-design` for design work that affects the upload journey, result presentation, visual hierarchy, responsiveness, interaction feedback, or accessibility.

Use `.codex/agents/frontend-designer.md` for implementation-oriented frontend work. Use `.codex/agents/frontend-quality-reviewer.md` for an independent review after a meaningful interface change.

## Frontend conventions

- Keep interface copy in Brazilian Portuguese.
- Use semantic HTML and Tailwind utilities. Preserve the dark Data Lab palette and teal primary action treatment unless the task asks to change the visual direction.
- Keep API calls on `/api`; the Vite development proxy forwards them to FastAPI.
- Never present a computed client-side metric as if it came from the backend.
- Preserve usable empty, loading, success, and recoverable-error states for async features.

## Checks

For changes in `apps/web`, run:

```sh
npm run check
npm run build
npm run check:code
```