const RAW_GITHUB_HOST = 'raw.githubusercontent.com'
const GITLAB_HOST = 'gitlab.com'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://static-preview.vercel.app',
  'http://localhost:5173',
]
const NAVIGATION_DESTINATIONS = new Set([
  'document',
  'iframe',
  'frame',
  'object',
  'embed',
])
const SAFE_PROXY_CONTENT_TYPE = 'text/plain; charset=utf-8'

export const MAX_PROXY_RESPONSE_BYTES = 5 * 1024 * 1024 // 5 MiB

export class ProxyRequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

function normalizeOrigin(
  origin: string | null | undefined,
): string | undefined {
  if (!origin) return undefined

  try {
    return new URL(origin).origin
  } catch {
    return undefined
  }
}

function hasUnsafePathSegment(pathSegments: string[]): boolean {
  return pathSegments.some((segment) => {
    let decodedSegment: string

    try {
      decodedSegment = decodeURIComponent(segment)
    } catch {
      return true
    }

    return (
      decodedSegment === '' || decodedSegment === '.' || decodedSegment === '..'
    )
  })
}

function splitPath(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function isAllowedGithubRawPath(pathname: string): boolean {
  const pathSegments = splitPath(pathname)

  // /:owner/:repo/:branch/:file...
  if (pathSegments.length < 4) return false
  if (hasUnsafePathSegment(pathSegments)) return false

  return true
}

function isAllowedGitlabRawPath(pathname: string): boolean {
  const pathSegments = splitPath(pathname)

  if (hasUnsafePathSegment(pathSegments)) return false

  const rawPathSegment = pathSegments.findIndex(
    (segment, idx) => segment === '-' && pathSegments[idx + 1] === 'raw',
  )

  // /:owner/(optional subgroups...)/:repo/-/raw/:branch/:file...
  if (rawPathSegment < 2) return false
  if (pathSegments.length <= rawPathSegment + 3) return false

  return true
}

export function isAllowedProxyTarget(target: URL): boolean {
  const normalizedHostname = target.hostname.toLowerCase()

  if (target.protocol !== 'https:') return false
  if (target.username || target.password) return false
  if (target.port) return false
  if (target.search.length > 0) return false

  if (normalizedHostname === RAW_GITHUB_HOST) {
    return isAllowedGithubRawPath(target.pathname)
  }

  if (normalizedHostname === GITLAB_HOST) {
    return isAllowedGitlabRawPath(target.pathname)
  }

  return false
}

export function parseProxyTarget(rawTarget: string | null): URL {
  if (!rawTarget) {
    throw new ProxyRequestError('Missing url param', 400)
  }

  let target: URL

  try {
    target = new URL(rawTarget)
  } catch {
    throw new ProxyRequestError('Invalid url param', 400)
  }

  target.hash = ''

  if (!isAllowedProxyTarget(target)) {
    throw new ProxyRequestError('Target url is not allowed', 403)
  }

  return target
}

export function getAllowedProxyOrigins(
  configuredOrigins: string | undefined,
  requestOrigin: string,
): string[] {
  const allowedOrigins = configuredOrigins
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin))

  if (allowedOrigins && allowedOrigins.length > 0) {
    return [...new Set(allowedOrigins)]
  }

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, requestOrigin])]
}

export function getRequestOrigin(headers: Headers): string | undefined {
  const originHeader = normalizeOrigin(headers.get('origin'))
  if (originHeader) return originHeader

  return normalizeOrigin(headers.get('referer'))
}

export function isAllowedOrigin(
  requestOrigin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!requestOrigin) return false
  return allowedOrigins.includes(requestOrigin)
}

export function buildCorsHeaders(
  originHeader: string | null,
  allowedOrigins: string[],
): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  })

  const requestOrigin = normalizeOrigin(originHeader)
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers.set('Access-Control-Allow-Origin', requestOrigin)
  }

  return headers
}

export function isNavigationProxyRequest(secFetchDest: string | null): boolean {
  if (!secFetchDest) return false
  return NAVIGATION_DESTINATIONS.has(secFetchDest.toLowerCase())
}

export function sanitizeProxyContentType(
  upstreamContentType: string | null,
): string {
  if (!upstreamContentType) {
    return SAFE_PROXY_CONTENT_TYPE
  }

  const normalizedContentType = upstreamContentType.toLowerCase()
  if (
    normalizedContentType.startsWith('text/html') ||
    normalizedContentType.startsWith('application/xhtml+xml')
  ) {
    return SAFE_PROXY_CONTENT_TYPE
  }

  return upstreamContentType
}
