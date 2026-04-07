jest.mock('$app/navigation', () => ({ goto: jest.fn() }), { virtual: true })

import { goto } from '$app/navigation'
import { Preview } from '../src/utils/preview'

const originalWarn = console.warn
const gotoMock = goto as jest.MockedFunction<typeof goto>

function mockResponse(status: number, body: string): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
  } as unknown as Response
}

function getProxyTarget(input: string | URL | Request): string {
  if (typeof input === 'string') {
    return new URL(input, 'http://localhost').searchParams.get('url') ?? ''
  }

  if (input instanceof URL) {
    return (
      new URL(input.toString(), 'http://localhost').searchParams.get('url') ??
      ''
    )
  }

  return new URL(input.url, 'http://localhost').searchParams.get('url') ?? ''
}

describe('[Preview] resource loading resilience', () => {
  let originalFetch: typeof fetch | undefined

  const htmlUrl =
    'https://raw.githubusercontent.com/example-owner/example-static-site/master/index.html'
  const proxiedCssUrl =
    'https://raw.githubusercontent.com/example-owner/example-static-site/master/styles/site.css'

  beforeEach(() => {
    document.body.innerHTML = '<iframe id="site-frame"></iframe>'
    originalFetch = global.fetch
    console.warn = jest.fn()
    gotoMock.mockClear()
  })

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch
    console.warn = originalWarn
  })

  it('skips proxy for non-allowlisted external stylesheet URLs', async () => {
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <link rel="stylesheet" href="https://cdn.invalid/css/demo.css" />
          <link rel="stylesheet" href="styles/site.css" />
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      if (target === proxiedCssUrl) {
        return mockResponse(200, 'body { color: #111; }')
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const requestedTargets = fetchMock.mock.calls.map(([input]) =>
      getProxyTarget(input as string | URL | Request),
    )

    expect(requestedTargets).toContain(htmlUrl)
    expect(
      requestedTargets.some((target) => target.includes('cdn.invalid')),
    ).toBe(false)
    expect(requestedTargets).toContain(proxiedCssUrl)
  })

  it('continues rendering when a proxied stylesheet fetch fails', async () => {
    const failingCssUrl =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/styles/failing.css'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <link rel="stylesheet" href="styles/failing.css" />
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      if (target === failingCssUrl) {
        return mockResponse(403, '{"message":"Target url is not allowed"}')
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()
  })

  it('continues rendering when a non-proxied external script fails', async () => {
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <script src="https://cdn.invalid/app.js"></script>
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    const externalScriptSpy = jest
      .spyOn(
        preview as unknown as {
          appendExternalScriptToHead: (
            src: string,
            type?: string,
          ) => Promise<void>
        },
        'appendExternalScriptToHead',
      )
      .mockRejectedValue(new Error('external script load failure'))

    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    expect(externalScriptSpy).toHaveBeenCalledWith(
      'https://cdn.invalid/app.js',
      undefined,
    )
  })

  it('preserves non-module script types during deferred replay', async () => {
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <script type="application/ld+json">
            {"@context":"https://schema.org","name":"Demo"}
          </script>
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const doc =
      document.querySelector<HTMLIFrameElement>('#site-frame')?.contentDocument
    const scriptTypes = [...(doc?.querySelectorAll('script') ?? [])].map(
      (script) => script.getAttribute('type'),
    )

    expect(scriptTypes).toContain('application/ld+json')
  })

  it('awaits single-url rendering before resolving', async () => {
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Delayed Demo Site</title>
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    let resolveFetch:
      | ((value: Response | PromiseLike<Response>) => void)
      | undefined

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return await new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    const renderPromise = preview.render(htmlUrl)
    let isSettled = false
    void renderPromise.then(() => {
      isSettled = true
    })

    await Promise.resolve()
    expect(isSettled).toBe(false)

    resolveFetch?.(mockResponse(200, htmlPayload))
    await expect(renderPromise).resolves.toBeUndefined()
  })

  it('resolves relative anchor clicks against base URI for in-preview navigation', async () => {
    const expectedNavigationTarget =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/docs/setup.html'
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
        </head>
        <body>
          <a id="relative-nav" href="docs/setup.html">Setup Guide</a>
        </body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const iframe = document.querySelector<HTMLIFrameElement>('#site-frame')
    expect(iframe).toBeTruthy()
    iframe?.dispatchEvent(new Event('load'))

    const relativeLink =
      iframe?.contentDocument?.querySelector<HTMLAnchorElement>('#relative-nav')
    expect(relativeLink).toBeTruthy()

    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    })
    const clickHandled = relativeLink?.dispatchEvent(clickEvent)

    expect(clickHandled).toBe(false)
    expect(gotoMock).toHaveBeenCalledWith(
      `/${encodeURIComponent(expectedNavigationTarget)}`,
    )
  })

  it('rewrites root-relative and hash links to remain in the proxied repo', async () => {
    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
        </head>
        <body>
          <a id="root-link" href="/files/press-pack-v2.zip">Press Pack</a>
          <a id="hash-link" href="#overview">Overview</a>
          <a id="relative-link" href="img/logo.png">Logo</a>
        </body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const doc =
      document.querySelector<HTMLIFrameElement>('#site-frame')?.contentDocument
    expect(doc).toBeTruthy()

    const rootLink = doc?.querySelector<HTMLAnchorElement>('#root-link')
    const hashLink = doc?.querySelector<HTMLAnchorElement>('#hash-link')
    const relativeLink = doc?.querySelector<HTMLAnchorElement>('#relative-link')

    expect(rootLink?.getAttribute('href')).toBe('files/press-pack-v2.zip')
    expect(hashLink?.getAttribute('href')).toBe('#overview')
    expect(relativeLink?.getAttribute('href')).toBe('img/logo.png')
  })

  it('rewrites media and stylesheet URLs to absolute raw repo URLs', async () => {
    const expectedImageUrl =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/img/logo.png'
    const expectedStylesheetUrl =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/styles/site.css'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <link id="repo-css" rel="stylesheet" href="styles/site.css" />
        </head>
        <body>
          <img id="hero" src="img/logo.png" />
        </body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      if (target === expectedStylesheetUrl) {
        return mockResponse(200, 'body { color: #111; }')
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const doc =
      document.querySelector<HTMLIFrameElement>('#site-frame')?.contentDocument
    expect(doc).toBeTruthy()

    const hero = doc?.querySelector<HTMLImageElement>('#hero')
    const css = doc?.querySelector<HTMLLinkElement>('#repo-css')

    expect(hero?.getAttribute('src')).toBe(expectedImageUrl)
    expect(css?.getAttribute('href')).toBe(expectedStylesheetUrl)
  })

  it('executes deferred scripts in order', async () => {
    const libraryScriptUrl =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/js/lib.js'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <script src="./js/lib.js"></script>
          <script>
            document.body.setAttribute(
              'data-lib-loaded',
              window.__libReady ? 'yes' : 'no',
            )
          </script>
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      if (target === libraryScriptUrl) {
        return mockResponse(200, 'window.__libReady = true;')
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const doc =
      document.querySelector<HTMLIFrameElement>('#site-frame')?.contentDocument
    expect(doc?.body.getAttribute('data-lib-loaded')).toBe('yes')
  })

  it('preserves script order for proxied and inline scripts', async () => {
    const proxiedScriptUrl =
      'https://raw.githubusercontent.com/example-owner/example-static-site/master/js/a.js'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Demo Site</title>
          <script src="./js/a.js"></script>
          <script>
            document.body.setAttribute('data-inline-order', window.__scriptOrder || 'missing')
          </script>
        </head>
        <body><h1>Site</h1></body>
      </html>
    `

    const fetchMock = jest.fn(async (input: string | URL | Request) => {
      const target = getProxyTarget(input)

      if (target === htmlUrl) {
        return mockResponse(200, htmlPayload)
      }

      if (target === proxiedScriptUrl) {
        return mockResponse(200, 'window.__scriptOrder = "proxied-first";')
      }

      throw new Error(`Unexpected proxy target requested: ${target}`)
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const preview = new Preview('#site-frame')
    await expect(preview.render(htmlUrl)).resolves.toBeUndefined()

    const doc =
      document.querySelector<HTMLIFrameElement>('#site-frame')?.contentDocument
    expect(doc?.body.getAttribute('data-inline-order')).toBe('proxied-first')
  })
})
