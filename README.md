<p align="center">
  <img src="https://raw.githubusercontent.com/SirajChokshi/static-preview/main/static/og.png" alt="Static Preview OG"/>
</p>

# Static Preview

Many websites are available on Github, but remain unhosted by their creators. Static Preview allows users to input a link to any Github, BitBucket, and GitLab repository containing an `index.html` file. All necessary files are requested directly from the user's client to the host and rendered locally.

In other words, Static Preview is a tool to "host" websites locally.

A hosted version application is available at https://static-preview.vercel.app.

## Limitations

Static Preview is not a full-fledged web server. It is a tool to preview static websites. As such, it has the following limitations:

- It does not support dynamic content (e.g. PHP, Node.js, etc.) or a build process (e.g. Gulp, Webpack, etc.)

## Roadmap

- [ ] Finish full support for more Git providers (e.g. GitLab, BitBucket)
- [ ] WASM support
- [ ] Sync SPA routing with browser history
- [ ] GitHub Gist support
- [ ] Local 'library' with IndexedDB (since we already maintain a cache)

## Development

Built with SvelteKit, TypeScript, and SCSS.

Get started by cloning the repo and running:

```sh
npm i
npm run dev -- --open
```

## License

Static Preview is available under the MIT License. [More info can be found here](./LICENSE)
