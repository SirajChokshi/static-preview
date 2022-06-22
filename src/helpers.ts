/* eslint-disable import/prefer-default-export */
export class QueryParams {
  static get() {
    const searchParams = new URLSearchParams(window.location.search)
    const processedParams: Record<string, string> = {}
    for (const [key, value] of searchParams) {
      processedParams[key] = value
    }
    return processedParams
  }

  static set(params: Record<string, string>) {
    if ('URLSearchParams' in window) {
      const searchParams = new URLSearchParams(window.location.search)
      Object.keys(params).forEach((key) => searchParams.set(key, params[key]))
      const newRelativePathQuery = `${
        window.location.pathname
      }?${searchParams.toString()}`
      window.history.pushState(null, '', newRelativePathQuery)
    }
  }
}

export function isValidURL(maybeURL: string) {
  return /^(ftp|http|https):\/\/[^ "]+$/.test(maybeURL)
}
