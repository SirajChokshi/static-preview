import {
  buildCorsHeaders,
  getAllowedProxyOrigins,
  getRequestOrigin,
  isAllowedOrigin,
  isNavigationProxyRequest,
  isAllowedProxyTarget,
  parseProxyTarget,
  ProxyRequestError,
  sanitizeProxyContentType,
} from '../src/utils/proxy'

function expectProxyError(fn: () => void, status: number) {
  try {
    fn()
    throw new Error('Expected proxy policy error')
  } catch (err) {
    expect(err).toBeInstanceOf(ProxyRequestError)
    expect((err as ProxyRequestError).status).toBe(status)
  }
}

describe('[Proxy] target validation', () => {
  it('allows raw GitHub URLs', () => {
    const target = new URL(
      'https://raw.githubusercontent.com/acme/site/main/index.html',
    )

    expect(isAllowedProxyTarget(target)).toBe(true)
  })

  it('allows GitLab raw URLs with subgroup path', () => {
    const target = new URL(
      'https://gitlab.com/acme/subgroup/site/-/raw/main/index.html',
    )

    expect(isAllowedProxyTarget(target)).toBe(true)
  })

  it('rejects non-https URLs', () => {
    expectProxyError(
      () =>
        parseProxyTarget(
          'http://raw.githubusercontent.com/acme/site/main/index.html',
        ),
      403,
    )
  })

  it('rejects non-allowlisted hosts', () => {
    expectProxyError(
      () =>
        parseProxyTarget('https://github.com/acme/site/blob/main/index.html'),
      403,
    )
  })

  it('rejects non-raw GitLab URLs', () => {
    expectProxyError(
      () =>
        parseProxyTarget('https://gitlab.com/acme/site/-/blob/main/index.html'),
      403,
    )
  })

  it('rejects GitLab raw URLs with no file segment', () => {
    expectProxyError(
      () => parseProxyTarget('https://gitlab.com/acme/site/-/raw/main'),
      403,
    )
  })

  it('rejects path traversal attempts', () => {
    expectProxyError(
      () =>
        parseProxyTarget(
          'https://raw.githubusercontent.com/acme/site/main/%2e%2e/index.html',
        ),
      403,
    )
  })
})

describe('[Proxy] origin and CORS policy', () => {
  it('returns configured origins when provided', () => {
    const allowedOrigins = getAllowedProxyOrigins(
      'https://preview.example.com, https://preview.example.com, invalid-origin',
      'https://ignored.example.com',
    )

    expect(allowedOrigins).toStrictEqual(['https://preview.example.com'])
  })

  it('falls back to default + request origin when env var missing', () => {
    const allowedOrigins = getAllowedProxyOrigins(
      undefined,
      'https://preview.example.com',
    )

    expect(allowedOrigins).toContain('https://preview.example.com')
    expect(allowedOrigins).toContain('https://static-preview.vercel.app')
    expect(allowedOrigins).toContain('http://localhost:5173')
  })

  it('prefers Origin header over Referer', () => {
    const headers = new Headers({
      origin: 'https://preview.example.com',
      referer: 'https://other.example.com/path',
    })

    expect(getRequestOrigin(headers)).toBe('https://preview.example.com')
  })

  it('falls back to Referer when Origin header is missing', () => {
    const headers = new Headers({
      referer: 'https://preview.example.com/path',
    })

    expect(getRequestOrigin(headers)).toBe('https://preview.example.com')
  })

  it('matches request origins against allowlist', () => {
    expect(
      isAllowedOrigin('https://preview.example.com', [
        'https://preview.example.com',
      ]),
    ).toBe(true)

    expect(isAllowedOrigin(undefined, ['https://preview.example.com'])).toBe(
      false,
    )
  })

  it('only sets ACAO for allowed origins', () => {
    const allowedCorsHeaders = buildCorsHeaders('https://preview.example.com', [
      'https://preview.example.com',
    ])
    expect(allowedCorsHeaders.get('Access-Control-Allow-Origin')).toBe(
      'https://preview.example.com',
    )

    const blockedCorsHeaders = buildCorsHeaders('https://evil.example.com', [
      'https://preview.example.com',
    ])
    expect(blockedCorsHeaders.get('Access-Control-Allow-Origin')).toBeNull()
  })
})

describe('[Proxy] response hardening', () => {
  it('blocks navigation-style requests', () => {
    expect(isNavigationProxyRequest('document')).toBe(true)
    expect(isNavigationProxyRequest('iframe')).toBe(true)
    expect(isNavigationProxyRequest('empty')).toBe(false)
    expect(isNavigationProxyRequest(null)).toBe(false)
  })

  it('downgrades HTML content types to plain text', () => {
    expect(sanitizeProxyContentType('text/html; charset=utf-8')).toBe(
      'text/plain; charset=utf-8',
    )
    expect(sanitizeProxyContentType('application/xhtml+xml')).toBe(
      'text/plain; charset=utf-8',
    )
  })

  it('keeps non-HTML content types unchanged', () => {
    expect(sanitizeProxyContentType('text/css')).toBe('text/css')
    expect(sanitizeProxyContentType('application/javascript')).toBe(
      'application/javascript',
    )
    expect(sanitizeProxyContentType(null)).toBe('text/plain; charset=utf-8')
  })
})
