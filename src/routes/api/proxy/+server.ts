import { env } from '$env/dynamic/private'
import { error } from '@sveltejs/kit'
import {
  buildCorsHeaders,
  getAllowedProxyOrigins,
  getRequestOrigin,
  isAllowedOrigin,
  MAX_PROXY_RESPONSE_BYTES,
  parseProxyTarget,
  ProxyRequestError,
} from '../../../utils/proxy'

export const prerender = false

function enforceProxyPolicy(request: Request, requestUrl: URL) {
  const allowedOrigins = getAllowedProxyOrigins(
    env.PROXY_ALLOWED_ORIGINS,
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

  let target: URL

  try {
    target = parseProxyTarget(url.searchParams.get('url'))
  } catch (err) {
    if (err instanceof ProxyRequestError) {
      throw error(err.status, err.message)
    }

    throw error(400, 'Invalid url param')
  }

  let upstream: Response

  try {
    upstream = await fetch(target.toString(), {
      redirect: 'follow',
      headers: {
        Accept: request.headers.get('accept') ?? '*/*',
      },
    })
  } catch {
    throw error(502, `Could not load ${target.toString()}`)
  }

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
    upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
  )
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Cache-Control', upstream.headers.get('cache-control') ?? 'public, max-age=300')

  const etag = upstream.headers.get('etag')
  if (etag) {
    headers.set('ETag', etag)
  }

  const lastModified = upstream.headers.get('last-modified')
  if (lastModified) {
    headers.set('Last-Modified', lastModified)
  }

  return new Response(payload, {
    status: upstream.status,
    headers,
  })
}
