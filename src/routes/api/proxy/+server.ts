import { error } from '@sveltejs/kit'
import { appendFileSync } from 'node:fs'
import {
  buildCorsHeaders,
  getAllowedProxyOrigins,
  getRequestOrigin,
  isAllowedOrigin,
  isNavigationProxyRequest,
  MAX_PROXY_RESPONSE_BYTES,
  parseProxyTarget,
  ProxyRequestError,
  sanitizeProxyContentType,
} from '../../../utils/proxy'

export const prerender = false

function writeDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  try {
    appendFileSync(
      '/opt/cursor/logs/debug.log',
      `${JSON.stringify({
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      })}\n`,
    )
  } catch {
    // Best-effort instrumentation only.
  }
}

function enforceProxyPolicy(request: Request, requestUrl: URL) {
  const allowedOrigins = getAllowedProxyOrigins(
    process.env.PROXY_ALLOWED_ORIGINS,
    requestUrl.origin,
  )
  const requestOrigin = getRequestOrigin(request.headers)

  if (!isAllowedOrigin(requestOrigin, allowedOrigins)) {
    throw error(403, 'Origin not allowed')
  }

  return buildCorsHeaders(request.headers.get('origin'), allowedOrigins)
}

export function OPTIONS({ request, url }) {
  const corsHeaders = enforceProxyPolicy(request, url)

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET({ request, url, fetch }) {
  const corsHeaders = enforceProxyPolicy(request, url)

  // #region agent log
  writeDebugLog('A', 'src/routes/api/proxy/+server.ts:69', 'Proxy GET entry', {
    urlParam: url.searchParams.get('url'),
    secFetchDest: request.headers.get('sec-fetch-dest'),
    requestOrigin:
      request.headers.get('origin') ?? request.headers.get('referer'),
  })
  // #endregion

  if (isNavigationProxyRequest(request.headers.get('sec-fetch-dest'))) {
    throw error(403, 'Direct navigation to proxy endpoint is not allowed')
  }

  let target: URL

  try {
    target = parseProxyTarget(url.searchParams.get('url'))
  } catch (err) {
    if (err instanceof ProxyRequestError) {
      // #region agent log
      writeDebugLog(
        'A',
        'src/routes/api/proxy/+server.ts:85',
        'Proxy target rejected by policy',
        {
          urlParam: url.searchParams.get('url'),
          status: err.status,
          reason: err.message,
        },
      )
      // #endregion

      throw error(err.status, err.message)
    }

    throw error(400, 'Invalid url param')
  }

  // #region agent log
  writeDebugLog(
    'C',
    'src/routes/api/proxy/+server.ts:102',
    'Proxy target accepted',
    {
      target: target.toString(),
      hostname: target.hostname,
      pathname: target.pathname,
    },
  )
  // #endregion

  let upstream: Response

  try {
    upstream = await fetch(target.toString(), {
      redirect: 'follow',
      headers: {
        Accept: request.headers.get('accept') ?? '*/*',
      },
    })
  } catch {
    // #region agent log
    writeDebugLog(
      'D',
      'src/routes/api/proxy/+server.ts:125',
      'Upstream fetch threw network error',
      {
        target: target.toString(),
      },
    )
    // #endregion

    throw error(502, `Could not load ${target.toString()}`)
  }

  // #region agent log
  writeDebugLog(
    'C',
    'src/routes/api/proxy/+server.ts:138',
    'Upstream fetch returned response',
    {
      target: target.toString(),
      status: upstream.status,
      contentType: upstream.headers.get('content-type'),
      contentLength: upstream.headers.get('content-length'),
    },
  )
  // #endregion

  const contentLength = Number(upstream.headers.get('content-length'))
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_PROXY_RESPONSE_BYTES
  ) {
    throw error(413, 'Upstream payload too large')
  }

  const payload = await upstream.arrayBuffer()
  if (payload.byteLength > MAX_PROXY_RESPONSE_BYTES) {
    throw error(413, 'Upstream payload too large')
  }

  const headers = new Headers(corsHeaders)
  headers.set(
    'Content-Type',
    sanitizeProxyContentType(upstream.headers.get('content-type')),
  )
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Content-Disposition', 'attachment')
  headers.set(
    'Content-Security-Policy',
    "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  )
  headers.set('X-Frame-Options', 'DENY')
  headers.set(
    'Cache-Control',
    upstream.headers.get('cache-control') ?? 'public, max-age=300',
  )

  const etag = upstream.headers.get('etag')
  if (etag) {
    headers.set('ETag', etag)
  }

  const lastModified = upstream.headers.get('last-modified')
  if (lastModified) {
    headers.set('Last-Modified', lastModified)
  }

  // #region agent log
  writeDebugLog(
    'C',
    'src/routes/api/proxy/+server.ts:190',
    'Proxy returning payload',
    {
      target: target.toString(),
      status: upstream.status,
      payloadBytes: payload.byteLength,
    },
  )
  // #endregion

  return new Response(payload, {
    status: upstream.status,
    headers,
  })
}
