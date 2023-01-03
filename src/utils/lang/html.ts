export function isHTML(maybeHTML: string): boolean {
  const $div = document.createElement('div')
  $div.innerHTML = maybeHTML
  return [...$div.childNodes].reverse().some(($child) => $child.nodeType === 1)
}

export function processHTML(html: string, url: string) {
  return (
    html
      // Add base tag to iframe
      .replace(/<head([^>]*)>/i, `<head$1><base href="${url}">`)
      // Replace absolute paths with relative paths
      .replace(/((src|href|content)=")\/(.*?")/gm, '$1$3')
  )
}
