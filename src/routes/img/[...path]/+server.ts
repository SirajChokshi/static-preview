import { error } from '@sveltejs/kit'
import {
  buildImageFallbackTargets,
  decodePreviewUrlFromReferer,
  isSupportedImageFallbackSource,
  sanitizeRelativePath,
} from '../../../utils/image-fallback'

export const prerender = false

export async function GET({ request, params, fetch }) {
  const imagePath = sanitizeRelativePath(params.path)
  if (!imagePath) {
    throw error(400, 'Invalid image path')
  }

  const previewUrl = decodePreviewUrlFromReferer(request.headers.get('referer'))
  if (!previewUrl) {
    throw error(404, 'Preview context unavailable')
  }

  if (!isSupportedImageFallbackSource(previewUrl)) {
    throw error(404, 'Preview source not supported for image fallback')
  }

  const targets = buildImageFallbackTargets(previewUrl, imagePath)
  if (!targets.length) {
    throw error(404, 'Could not resolve image target')
  }

  for (const target of targets) {
    let upstream: Response
    try {
      upstream = await fetch(target, {
        redirect: 'follow',
        headers: {
          Accept: request.headers.get('accept') ?? 'image/*,*/*',
        },
      })
    } catch {
      continue
    }

    if (!upstream.ok) {
      continue
    }

    const payload = await upstream.arrayBuffer()
    const headers = new Headers()

    const contentType = upstream.headers.get('content-type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    }
    headers.set(
      'Cache-Control',
      upstream.headers.get('cache-control') ?? 'public, max-age=300',
    )

    return new Response(payload, {
      status: upstream.status,
      headers,
    })
  }

  throw error(404, 'Image not found')
}
