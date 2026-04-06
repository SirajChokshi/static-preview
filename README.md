<p align="center">
  <img src="https://raw.githubusercontent.com/SirajChokshi/static-preview/main/static/og.png" alt="Static Preview OG"/>
</p>

# Static Preview

Many websites are available on Github, but remain unhosted by their creators. Static Preview allows users to input a link to any Github or GitLab repository containing an `index.html` file. All necessary files are requested directly from the user's client to the host and rendered locally.

In other words, Static Preview is a tool to "host" websites locally.

A hosted version of the application is available at https://static-preview.vercel.app.

## Limitations

Static Preview is not a full-fledged web server. It is a tool to preview static websites. As such, it has the following limitations:

- Does not support dynamic content (e.g. PHP, Node.js, etc.) or a build process (e.g. Gulp, Webpack, etc.)
- [CORB](https://chromium.googlesource.com/chromium/src/+/master/services/network/cross_origin_read_blocking_explainer.md) blocks some requests (e.g. `fetch` requests to `localhost`)

## Development

Built with SvelteKit, TypeScript, and SCSS.

Get started by cloning the repo and running:

```sh
npm i
npm run dev -- --open
```

## Proxy Configuration

Preview fetching now uses the first-party SvelteKit endpoint at `/api/proxy` (instead of `api.codetabs.com`), which requires a server adapter such as Vercel.

To lock down CORS for your deployment domain(s), configure:

```sh
PROXY_ALLOWED_ORIGINS=https://static-preview.vercel.app,http://localhost:5173
```

Security constraints in `/api/proxy`:

- only proxies `https://raw.githubusercontent.com/...` URLs
- only proxies GitLab `https://gitlab.com/.../-/raw/...` URLs
- rejects non-HTTPS targets, query strings, and path traversal
- allows requests only from configured origins (checks `Origin` then `Referer`)
- enforces a max upstream payload size of 5 MiB

## Testing

We use [Jest](https://jestjs.io/) for unit testing. Only URL parsing is tested to prevent regressions.

Run tests with:

```sh
npm run test
```

## License

Static Preview is available under the MIT License. [More info can be found here](./LICENSE)
