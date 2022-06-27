import { resourceType } from '../constants/resources'

export function isValidURL(maybeURL: string) {
  return /^(ftp|http|https):\/\/[^ "]+$/.test(maybeURL)
}

export function getResourceType(currentUrl: string): resourceType {
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
