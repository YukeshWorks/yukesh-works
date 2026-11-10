# Yukeshworks

A personal portfolio and interactive playground for Yukesh Kumar.

## Application

- Framework: Vite + React + TypeScript
- Build command: `npm run build`
- Output directory: `dist`
- Home: personal introduction, social links and cinematic visual treatment
- Vault: Snake, Rainbow Scratch, Memory Match and Island Creator
- About: personal profile and information
- Secret terminal: visual Easter egg only; it is not a security boundary

## Hosting

The independent hosting target is Vercel, connected to this GitHub repository. `vercel.json` defines the Vite static build and SPA fallback. GitLab Pages configuration is included as an additional option after the repo has been imported into GitLab.

- **Production website:** https://your-profile-showcase.vercel.app
- Legacy rollback copy (Lovable-hosted): https://yukeshworks.lovable.app
- Source repository: https://github.com/YukeshWorks/yukesh-works
- Development branch for migration work: `migration/gitlab-pages`

The existing Lovable deployment should be retained as a rollback until the new host has been verified and the final domain choice is configured. The independent host will not include the hosting-injected Lovable edit badge.

## Local development

Requirements: Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Checks:

```sh
npm run lint
npm test
npm run build
```

## Environment and Supabase

The browser app uses Supabase URL and publishable key configuration. `.env.production` contains only those public client values for the current project. For local development, copy `.env.example` to `.env.local`.

Google sign-in now uses Supabase Auth directly rather than Lovable's auth broker. It requires Google OAuth to be enabled in the Supabase project and the independent site's origin to be allowed in Supabase Auth URL configuration. A browser publishable key is public by design; privileged service-role keys and OAuth client secrets must never be placed in `VITE_` variables.

The repository contains a `game_scores` SQL migration, but live migration state and RLS policies must be verified in the Supabase project before claiming database features are production-ready. The frontend does not currently persist mini-game scores to that table.

## CI and deployment

- GitHub Actions runs install, lint, unit tests and a production build for pushes and pull requests.
- Vercel's Git integration provides PR previews and deploys the configured production branch.
- GitLab Pages can build the static `dist` folder once the source repository has been imported and Pages access is configured.

## Development workflow

- ChatGPT: implementation planning, code review and debugging support.
- GitHub: source control and pull-request review.
- Codespaces: browser-based editor and development environment.
- Vercel: independent hosting and deployments.
- GitLab: secondary repository and static-hosting fallback.
- Notion: durable decisions, release notes, audit findings and verification records.
