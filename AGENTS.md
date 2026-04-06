# AGENTS.md

## Cursor Cloud specific instructions

**Static Preview** is a client-side SvelteKit app that renders static websites from GitHub/GitLab repositories. No backend, no database, no Docker required.

### Commands

| Task         | Command                                           |
| ------------ | ------------------------------------------------- |
| Install deps | `npm install`                                     |
| Dev server   | `npm run dev` (serves on `http://localhost:5173`) |
| Lint         | `npm run lint` (prettier + eslint)                |
| Tests        | `npm run test` (Jest — URL parsing only)          |
| Build        | `npm run build`                                   |
| Type check   | `npm run check`                                   |

### Notes

- The `prepare` script (`svelte-kit sync`) runs automatically during `npm install`. If you see import errors for `$app/*` modules, re-run `npm install`.
- The dev server uses Vite's default port **5173**. Pass `--host 0.0.0.0` to expose it outside localhost: `npm run dev -- --host 0.0.0.0`.
- Requires **Node.js >= 24** (`engines` field in `package.json`). Use `nvm use 24` if multiple versions are installed.
- Preview functionality uses the internal `/api/proxy` endpoint. Configure `PROXY_ALLOWED_ORIGINS` with deployment origins (comma separated) to restrict CORS.
- `svelte-preprocess` deprecation warnings about "defaults" are expected and harmless.
- The `package-lock.json` uses npm; do not mix with other package managers.
