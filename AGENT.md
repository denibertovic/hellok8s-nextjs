# Agent Instructions for hellok8s-nextjs

## Commands

- **Build**: `yarn build` or `next build`
- **Dev**: `yarn dev` (uses Turbo)
- **Lint**: `yarn lint` (ESLint with Next.js)
- **Lint Fix**: `yarn lint:fix`
- **Type Check**: `yarn typecheck` or `tsc --noEmit`
- **Format Check**: `yarn format:check`
- **Format Write**: `yarn format:write`
- **Full Check**: `yarn check` (lint + typecheck)

## Workflow Rules

- **Auto-format**: Always run `yarn format:write` after making any code changes to ensure consistent formatting
- **Lint Check**: Always run `yarn check` after making code changes to catch linting and type errors
- **Yarn Install**: Always use `yarn install --immutable` instead of `--frozen-lockfile` (deprecated in Yarn v2+)
- NEVER run `yarn dev`. Instead you should use `devenv up -d`. ALWAYS check if the
  dev environment is already running first because maybe the user already started it.
- When working on a task ALWAYS notify the user when it's finished by running the following
  command: notify-send "AGENT: Finished! <VERY_SHORT_TASK_SUMMARY>" and replace <VERY_SHORT_TAKS_SUMMARY> with
  a very short summary of what you've done. Once to two sentences MAX!
- When going to ask the user for permisson ALWAY first run: notify-send "AGENT: I need permission to run <COMMAND>" and
  replace <COMMAND> with whatever you need permission or input for.

## Code Style

- **TypeScript**: Strict mode, `noUncheckedIndexedAccess`, prefer type imports with `type` keyword
- **Components**: PascalCase naming, `.tsx` extension, use `"use client"` for client components
- **Imports**: External first, then `@/` prefixed internal imports (e.g., `@/trpc/react`)
- **tRPC**: Use `useSuspenseQuery()`, `useMutation()` hooks; invalidate queries with `utils.invalidate()`
- **Forms**: Handle `isPending` state for mutations, use `onSuccess` callbacks
- **Styling**: Tailwind CSS classes, responsive design patterns
- **Error Handling**: Zod validation on tRPC inputs, check mutation states
- **Naming**: camelCase for variables/functions, SCREAMING_SNAKE_CASE for constants

## Version Management

- **Authoritative Source**: All software versions are defined in `devenv.nix` and are the single source of truth
- **Consistency Rule**: Any version specified in `devenv.nix` (Node.js, package versions, etc.) MUST be used consistently across:
  - `Dockerfile` base images
  - GitHub Actions workflow Node.js versions
  - Any other configuration files that specify versions
- **When Updating**: Always update `devenv.nix` first, then propagate changes to all other files
