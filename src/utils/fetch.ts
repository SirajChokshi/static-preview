import { PreviewError, errorType } from './errors'

export async function proxyFetch(url: string) {
  const res = await fetch(
    `https://api.codetabs.com/v1/proxy/?quest=${url}`,
    undefined,
  )

  if (!res.ok)
    throw new PreviewError(`Could not load ${url}`, errorType.NETWORK_ERROR)

  const raw = await res.text()

  if (res.status === 404 || raw.includes('<title>Not Found</title>'))
    // Manually check for this title since Gitlab returns a 200 for non-existent files
    throw new PreviewError(`Could not load ${url}`, errorType.NOT_FOUND)

  return raw
}
