export function isHTML(maybeHTML: string): boolean {
  const $div = document.createElement('div')
  $div.innerHTML = maybeHTML
  return [...$div.childNodes].reverse().some(($child) => $child.nodeType === 1)
}

function getFetchResolverScript() {
  return `<script data-static-preview-fetch-resolver>
;(() => {
  const proxyPrefix = 'https://api.codetabs.com/v1/proxy/?quest='
  const nativeFetch = window.fetch.bind(window)

  const shouldProxy = (url) => {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    if (url.href.startsWith(proxyPrefix)) {
      return false
    }

    const baseUrl = new URL(document.baseURI)
    return url.origin === baseUrl.origin
  }

  window.fetch = (input, init) => {
    try {
      const requestUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url

      const absoluteUrl = new URL(requestUrl, document.baseURI)

      if (shouldProxy(absoluteUrl)) {
        const proxiedUrl = \`\${proxyPrefix}\${encodeURIComponent(absoluteUrl.href)}\`

        if (typeof input !== 'string' && !(input instanceof URL)) {
          return nativeFetch(new Request(proxiedUrl, input), init)
        }

        return nativeFetch(proxiedUrl, init)
      }
    } catch {}

    return nativeFetch(input, init)
  }
})()
</script>`
}

function getTitle(html: string) {
  // TODO: Regex might reasonably be faster here
  const $div = document.createElement('div')
  $div.innerHTML = html
  const $title = $div.querySelector('title')
  return $title?.textContent ?? undefined
}

export interface HTMLPageData {
  // TODO - move this to a separate file
  title?: string

  // TODO: this is a glorified return type for processHTML, let's split
  // this into a separate type for usage in the UI
  processedHTML: string
}

export function processHTML(html: string, url: string): HTMLPageData {
  const processedHTML = html
    // Add base tag to iframe
    .replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${url}">${getFetchResolverScript()}`,
    )
    // Replace absolute paths with relative paths
    .replace(/((src|href|content)=")\/(.*?")/gm, '$1$3')

  return {
    processedHTML,
    title: getTitle(processedHTML),
  }
}
