jest.mock('$app/navigation', () => ({ goto: jest.fn() }), { virtual: true })

import { Preview } from '../src/utils/preview'

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

  beforeEach(() => {
    document.body.innerHTML = '<iframe id="site-frame"></iframe>'
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch as typeof fetch
  })

  it('skips proxy for non-allowlisted external stylesheet URLs', async () => {
    const htmlUrl =
      'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/index.html'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>OpenEmu</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100;400;700&display=swap" />
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
      requestedTargets.some((target) =>
        target.includes('fonts.googleapis.com'),
      ),
    ).toBe(false)
  })

  it('continues rendering when a proxied stylesheet fetch fails', async () => {
    const htmlUrl =
      'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/index.html'
    const failingCssUrl =
      'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/styles/failing.css'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>OpenEmu</title>
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

  it('awaits single-url rendering before resolving', async () => {
    const htmlUrl =
      'https://raw.githubusercontent.com/OpenEmu/openemu.github.io/master/index.html'

    const htmlPayload = `
      <!doctype html>
      <html>
        <head>
          <title>Delayed OpenEmu</title>
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
})
