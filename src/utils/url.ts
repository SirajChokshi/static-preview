import { resourceType } from '../constants/resources'

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

function processGithubURL(urlStr: string): string {
  const processedUrl = urlStr
    .replace('//github.com/', '//raw.githubusercontent.com/')
    .replace(/\/blob\//, '/') // Get URL of the raw file

  return processedUrl
}

function processGitlabURL(urlStr: string): string {
  const url = new URL(urlStr)

  if (url.pathname.includes('/blob/')) {
    // the first instance of /blob/ is the branch name
    // unless the project or user's name includes /blob/
    // TODO: handle arbitrary `blob` in project name
    url.pathname = url.pathname.replace('/blob/', '/raw/')
  }

  return url.href
}

/**
 * Process a URL based on hostname
 */
export function processUrl(url: string) {
  const urlType = getResourceType(url, false)

  if (urlType === resourceType.GITHUB) {
    return processGithubURL(url)
  }

  if (urlType === resourceType.GITLAB) {
    return processGitlabURL(url)
  }

  if (urlType === resourceType.BITBUCKET) {
    throw new Error('Bitbucket not yet supported')
  }

  return url
}

/**
 * Returns a list of possible URLs
 */
export function getPossibleUrls(url: string): string[] {
  const baseUrl = processUrl(url)

  return [
    // TODO - first check if the user is attempting to load without a file path
    `${baseUrl}/main/index.html`,
    `${baseUrl}/master/index.html`,
  ]
}
