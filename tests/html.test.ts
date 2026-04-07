import { processHTML } from '../src/utils/lang/html'

const HTML_URL =
  'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/main/wasm.html'

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

  it('rewrites leading slash paths to document-relative paths', () => {
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

    expect(processedHTML).toContain('href="assets/main.css"')
    expect(processedHTML).toContain('content="assets/preview.png"')
    expect(processedHTML).toContain('href="index.html"')
    expect(processedHTML).toContain('src="assets/wasm.js"')
  })
})
