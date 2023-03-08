export function isHTML(maybeHTML: string): boolean {
  const $div = document.createElement('div')
  $div.innerHTML = maybeHTML
  return [...$div.childNodes].reverse().some(($child) => $child.nodeType === 1)
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
    .replace(/<head([^>]*)>/i, `<head$1><base href="${url}">`)
    // Replace absolute paths with relative paths
    .replace(/((src|href|content)=")\/(.*?")/gm, '$1$3')

  return {
    processedHTML,
    title: getTitle(processedHTML),
  }
}
