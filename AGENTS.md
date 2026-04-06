# AGENTS.md

## Cursor Cloud specific instructions

**Static Preview** is a client-side SvelteKit app that renders static websites from GitHub/GitLab repositories. No backend, no database, no Docker required.

### Commands

| Task         | Command                                           |
| ------------ | ------------------------------------------------- |
| Install deps | `npm install`                                     |
| Dev server   | `npm run dev` (serves on `http://localhost:3000`) |
| Lint         | `npm run lint` (prettier + eslint)                |
| Tests        | `npm run test` (Jest — URL parsing only)          |
| Build        | `npm run build`                                   |
| Type check   | `npm run check`                                   |

### Notes

- The `prepare` script (`svelte-kit sync`) runs automatically during `npm install`. If you see import errors for `$app/*` modules, re-run `npm install`.
- The dev server uses port **3000** by default. Pass `--host 0.0.0.0` to expose it outside localhost: `npm run dev -- --host 0.0.0.0`.
- Preview functionality depends on the external CORS proxy `api.codetabs.com`. If previews fail to load, this third-party service may be down.
- `svelte-preprocess` deprecation warnings about "defaults" are expected and harmless.
- The `package-lock.json` uses npm; do not mix with other package managers.
