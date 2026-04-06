import { PreviewError, errorType } from './errors'

export async function proxyFetch(url: string) {
  const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
  const raw = await res.text()

  if (res.status === 404 || raw.includes('<title>Not Found</title>'))
    // Manually check for this title since Gitlab returns a 200 for non-existent files
    throw new PreviewError(`Could not load ${url}`, errorType.NOT_FOUND)

  if (!res.ok)
    throw new PreviewError(`Could not load ${url}`, errorType.NETWORK_ERROR)

  return raw
}
