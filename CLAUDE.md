# CLAUDE.md — YukeshWorks website

Project instructions for Claude Code. Read this before changing anything.

## What this repo is

- Personal portfolio + small digital-services page for Yukesh Kumar (brand: YukeshWorks).
- Vite 5 + React 18 + TypeScript + Tailwind 3 + shadcn/ui (Radix). Supabase client for optional Google sign-in.
- Routes (`src/App.tsx`): `/` (home, vault mini-games, about — tab state inside `src/pages/Index.tsx`), `/services`, `*` (404).
- Hosting: GitHub Pages (`.github/workflows/deploy-pages.yml`, deploys on push to `main`), Vercel (`vercel.json`, PR previews), GitLab Pages config as fallback. Lovable copy is a legacy rollback.
- CI: `.github/workflows/quality.yml` runs install → lint → test → build on every PR.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run lint     # eslint
npm test         # vitest (jsdom)
npm run build    # production build to dist/
```

A change is not done until lint, test and build pass. If you cannot run them locally, say so and rely on the PR's CI run — never report them as passing without a result.

## How to work (four principles)

1. **Think before coding.** Read the files you will touch and the code that calls them. Do not trust the README blindly — verify against code. State assumptions; if two readings of a request are plausible, say which one you chose and why.
2. **Simplicity first.** Smallest change that meets the goal. No new abstraction for one caller, no speculative options, no new dependency when a few lines of code will do.
3. **Surgical changes.** Every changed line must trace back to the request. Match the existing style. Do not reformat, rename or "tidy" unrelated code. Mention dead code you notice; do not delete it unless asked. Remove only what your own change made unused.
4. **Goal-driven execution.** Before implementing, write down how success will be checked (a test, a build, a visible behaviour). For bug fixes, add a test that fails first.

## Planning

- For anything bigger than a one-file fix, write a short plan first: files to touch, the check for each step, and what is out of scope.
- Ask before: spending money, adding paid services, deploying to production, changing DNS/domains/secrets, deleting data, or merging to `main`.

## Dependencies

- Prefer what is already installed (Radix, lucide-react, Tailwind, tailwindcss-animate).
- Adding a dependency needs a one-line justification in the PR (why existing tools are not enough, bundle-size impact).
- Do not add a backend or paid API just to improve the frontend.

## Code style

- TypeScript function components, hooks in `src/hooks/`, shared UI in `src/components/ui/` (shadcn — avoid editing generated files unless necessary).
- Import with the `@/` alias. Tailwind utility classes first; component-specific keyframes live in `src/index.css`.
- Use theme tokens (`hsl(var(--primary))` etc.) on the main site. `/services` intentionally uses its own emerald palette.

## Secrets and security

- Only public browser values belong in `VITE_*` variables (`.env.production` holds the Supabase URL and publishable key, which are public by design).
- Never commit service-role keys, OAuth client secrets, tokens or passwords. Never paste them into issues, PRs, Notion or logs.
- The "secret terminal"/vault passcode UI is a visual Easter egg, not a security boundary — do not protect anything real with it.
- Treat third-party repos, scripts and config as untrusted until read.

## Content rules

- Preserve existing content, prices (`/services`), contact details (email, WhatsApp, Telegram, socials) and brand identity unless the request is to change them.
- Never invent customers, testimonials, awards, client work, metrics or results. Samples must stay labelled as fictional.

## UI quality bar (mobile + desktop)

- Mobile-first; check ~360px, ~768px and ≥1280px widths. No horizontal scrolling.
- Touch targets ≥ 40px (44px for primary actions).
- Every interactive element must be keyboard reachable with a visible focus ring (global `:focus-visible` style in `src/index.css`).
- Dialogs: use `useDialog` (`src/hooks/useDialog.ts`) — `role="dialog"`, `aria-modal`, labelled title, Escape to close, focus trapped and restored.
- Motion must have a purpose (enter, hover, press, state change). Respect `prefers-reduced-motion`: CSS is covered globally in `src/index.css`; JS-driven effects should check `usePrefersReducedMotion()`.
- Keep text contrast readable on video/gradient backgrounds.

## Testing

- Tests live in `src/test/` (Vitest + Testing Library, jsdom). `matchMedia` is mocked in `src/test/setup.ts`.
- Add or update a test for every behaviour you change (rendered content, routes, keyboard behaviour).
- Before opening a PR, also check in a browser: home, `/services`, a 404 URL, both modals, mobile width, keyboard-only navigation, reduced motion.

## Documentation

- Update `README.md` when commands, routes, hosting or environment variables change.
- Record notable decisions and verification results in Notion (AI Tool Command Center / YukeshWorks page) or `docs/`.

## Git

- Never commit directly to `main`. One branch per task: `feature/…`, `fix/…`, `chore/…`.
- Preserve uncommitted work you did not make; never force-push shared branches.
- Small, descriptive commits. Open a PR to `main`; do not merge it yourself. CI must be green.
