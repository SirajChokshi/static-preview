import { resourceType } from '../../types/resources'
import { Github } from './github'
import { Gitlab } from './gitlab'

export function isValidURL(maybeURL: string) {
  return /^(ftp|http|https):\/\/[^ "]+$/.test(maybeURL)
}

export function getResourceType(
  currentUrl: string,
  /** Allows HTML return type */
  useHTML = true,
): resourceType {
  if (useHTML && currentUrl.endsWith('.html')) {
    return resourceType.HTML
  }

  if (currentUrl.includes('github')) {
    return resourceType.GITHUB
  }
  if (currentUrl.includes('bitbucket')) {
    return resourceType.BITBUCKET
  }
  if (currentUrl.includes('gitlab')) {
    return resourceType.GITLAB
  }

  return resourceType.HTML
}

/**
 * Process a URL based on hostname
 */
export function processUrl(url: string): string[] {
  const urlType = getResourceType(url, false)

  if (urlType === resourceType.GITHUB) {
    return Github.process(url)
  }

  if (urlType === resourceType.GITLAB) {
    return Gitlab.process(url)
  }

  if (urlType === resourceType.BITBUCKET) {
    throw new Error('Bitbucket not yet supported')
  }

  return [url]
}
