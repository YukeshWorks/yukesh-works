# Yukeshworks

The existing personal website built with Lovable.

## Website

**Live website:** https://yukeshworks.lovable.app

## Project editing workflow

### Lovable

Open your existing project from the [Lovable dashboard](https://lovable.dev/projects). Use Lovable for visual editing, prompt-based changes, and publishing. This repository has recent commits from the Lovable GitHub integration.

### GitHub

**Source repository:** https://github.com/YukeshWorks/yukesh-works

Use feature branches for changes, review pull requests, and merge into `main` only after validation. Keep credentials and private keys out of Git.

### GitHub Codespaces

[Open the prepared Codespace on the setup branch](https://codespaces.new/YukeshWorks/yukesh-works/tree/setup/codespaces).

The Codespaces configuration uses Node.js 22, installs dependencies with `npm ci`, starts the Vite development server when the Codespace attaches, and forwards port 8080 for the browser preview.

### Local development

Requirements: Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run lint
npm test
npm run build
```

## Stack

- Vite
- React
- TypeScript
- shadcn/ui
- Tailwind CSS
- Supabase client integration

## Publishing

Use the existing Lovable project to publish website changes. Do not create a duplicate Lovable project or replace its deployment setup unless explicitly intended.

## Working agreement

- ChatGPT: plan, inspect, implement scoped changes, review diffs, debug, and document results.
- GitHub: source control and pull-request review.
- Codespaces: interactive editing and preview/testing environment.
- Lovable: existing visual builder and publishing workflow.
- Notion: durable requirements, decisions, changelog, issues, and verification records.
