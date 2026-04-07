import { resourceType } from '../types/resources'
import { getResourceType, isValidURL, processUrl } from './url'

function getRepositoryRoot(rawHtmlUrl: URL): string | undefined {
  const segments = rawHtmlUrl.pathname.split('/').filter(Boolean)

  if (
    rawHtmlUrl.hostname === 'raw.githubusercontent.com' &&
    segments.length >= 3
  ) {
    const [owner, repo, branch] = segments
    return `https://${rawHtmlUrl.hostname}/${owner}/${repo}/${branch}/`
  }

  const rawMarker = segments.findIndex(
    (segment, idx) => segment === '-' && segments[idx + 1] === 'raw',
  )
  if (rawHtmlUrl.hostname === 'gitlab.com' && rawMarker >= 2) {
    return `https://${rawHtmlUrl.hostname}/${segments
      .slice(0, rawMarker + 3)
      .join('/')}/`
  }

  return undefined
}

export function sanitizeRelativePath(
  pathParam: string | undefined,
): string | undefined {
  if (!pathParam) {
    return undefined
  }

  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(pathParam)
  } catch {
    return undefined
  }

  const segments = decodedPath.split('/').filter(Boolean)
  if (!segments.length) {
    return undefined
  }

  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return undefined
  }

  return segments.join('/')
}

export function decodePreviewUrlFromReferer(
  refererHeader: string | null,
): string | undefined {
  if (!refererHeader) {
    return undefined
  }

  let refererUrl: URL
  try {
    refererUrl = new URL(refererHeader)
  } catch {
    return undefined
  }

  const queryUrl = refererUrl.searchParams.get('url')
  if (queryUrl && isValidURL(queryUrl)) {
    return queryUrl
  }

  const slug = refererUrl.pathname.replace(/^\/+/, '')
  if (!slug) {
    return undefined
  }

  try {
    const decodedSlug = decodeURIComponent(slug)
    if (isValidURL(decodedSlug)) {
      return decodedSlug
    }
  } catch {
    return undefined
  }

  return undefined
}

export function buildImageFallbackTargets(
  previewUrl: string,
  imagePath: string,
): string[] {
  const htmlCandidates = processUrl(previewUrl)
  const targets: string[] = []

  htmlCandidates.forEach((candidate) => {
    let candidateUrl: URL
    try {
      candidateUrl = new URL(candidate)
    } catch {
      return
    }

    const repositoryRoot = getRepositoryRoot(candidateUrl)
    if (!repositoryRoot) {
      return
    }

    targets.push(new URL(`img/${imagePath}`, repositoryRoot).toString())
  })

  return [...new Set(targets)]
}

export function isSupportedImageFallbackSource(previewUrl: string): boolean {
  const previewType = getResourceType(previewUrl, false)
  return (
    previewType === resourceType.GITHUB || previewType === resourceType.GITLAB
  )
}
