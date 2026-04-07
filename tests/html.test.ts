import { processHTML } from '../src/utils/lang/html'

const HTML_URL = 'https://example.invalid/example-site/main/wasm.html'

describe('[HTML] processHTML', () => {
  it('injects base url and runtime fetch resolver', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>WASM | Static Preview Test</title>
        </head>
        <body>
          <script src="/assets/wasm.js"></script>
        </body>
      </html>
    `

    const { processedHTML, title } = processHTML(html, HTML_URL)

    expect(processedHTML).toContain(`<base href="${HTML_URL}">`)
    expect(processedHTML).toContain('data-static-preview-fetch-resolver')
    expect(processedHTML).toContain('window.fetch = (input, init) =>')
    expect(title).toEqual('WASM | Static Preview Test')
  })

  it('rewrites resource URLs while preserving navigational links', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="/assets/main.css" />
          <meta content="/assets/preview.png" />
        </head>
        <body>
          <a href="/index.html">Home</a>
          <script src="/assets/wasm.js"></script>
        </body>
      </html>
    `

    const { processedHTML } = processHTML(html, HTML_URL)

    expect(processedHTML).toContain(
      'href="https://example.invalid/example-site/main/assets/main.css"',
    )
    expect(processedHTML).toContain('content="/assets/preview.png"')
    expect(processedHTML).toContain('href="index.html"')
    expect(processedHTML).toContain(
      'data-preview-script-src="https://example.invalid/example-site/main/assets/wasm.js"',
    )
  })
})
