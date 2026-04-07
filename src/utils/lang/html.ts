export function isHTML(maybeHTML: string): boolean {
  const $div = document.createElement('div')
  $div.innerHTML = maybeHTML
  return [...$div.childNodes].reverse().some(($child) => $child.nodeType === 1)
}

export const PREVIEW_SCRIPT_PLACEHOLDER_TYPE =
  'application/static-preview-script'
export const PREVIEW_SCRIPT_SRC_ATTRIBUTE = 'data-preview-script-src'
export const PREVIEW_SCRIPT_TYPE_ATTRIBUTE = 'data-preview-script-type'

function getTitle(html: string) {
  // TODO: Regex might reasonably be faster here
  const $div = document.createElement('div')
  $div.innerHTML = html
  const $title = $div.querySelector('title')
  return $title?.textContent ?? undefined
}

function serializeDoctype(doc: Document): string {
  const { doctype } = doc
  if (!doctype) {
    return ''
  }

  let serialized = `<!DOCTYPE ${doctype.name}`

  if (doctype.publicId) {
    serialized += ` PUBLIC "${doctype.publicId}"`
  } else if (doctype.systemId) {
    serialized += ' SYSTEM'
  }

  if (doctype.systemId) {
    serialized += ` "${doctype.systemId}"`
  }

  serialized += '>'
  return serialized
}

function rewriteRootRelativeAttributes(doc: Document) {
  const rootRelativeAttributes = ['src', 'href'] as const
  const $assets = doc.querySelectorAll<HTMLElement>('[src], [href], [content]')

  for (const $asset of $assets) {
    for (const attr of rootRelativeAttributes) {
      const value = $asset.getAttribute(attr)
      if (!value) {
        continue
      }

      // Keep protocol-relative URLs (`//cdn.example.com`) untouched.
      if (!value.startsWith('/') || value.startsWith('//')) {
        continue
      }

      $asset.setAttribute(attr, value.slice(1))
    }
  }
}

function isAbsoluteOrSpecialUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase()

  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('//') ||
    normalized.startsWith('data:') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:') ||
    normalized.startsWith('javascript:') ||
    normalized.startsWith('#')
  )
}

function rewriteRelativeResourceAttributes(doc: Document, pageUrl: URL) {
  const urlAttributes = ['src', 'href'] as const
  const $assets = doc.querySelectorAll<HTMLElement>('[src], [href], [content]')

  for (const $asset of $assets) {
    const tagName = $asset.tagName.toLowerCase()

    for (const attr of urlAttributes) {
      const value = $asset.getAttribute(attr)
      if (!value) {
        continue
      }

      // Preserve navigation links and already-absolute values.
      if (
        (attr === 'href' && (tagName === 'a' || tagName === 'area')) ||
        isAbsoluteOrSpecialUrl(value) ||
        value.startsWith('/')
      ) {
        continue
      }

      try {
        $asset.setAttribute(attr, new URL(value, pageUrl).toString())
      } catch {
        // Keep original attribute when URL parsing fails.
      }
    }
  }
}

function normalizePathname(pathname: string): string {
  const segments = pathname.split('/')
  const normalized: string[] = []

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue
    }

    if (segment === '..') {
      normalized.pop()
      continue
    }

    normalized.push(segment)
  }

  return `/${normalized.join('/')}`
}

export function getRepositoryRoot(url: URL): string {
  const pathname = normalizePathname(url.pathname)
  const segments = pathname.split('/').filter(Boolean)

  if (url.hostname === 'raw.githubusercontent.com' && segments.length >= 3) {
    const [owner, repo, branch] = segments
    return `https://${url.hostname}/${owner}/${repo}/${branch}/`
  }

  const rawMarker = segments.findIndex(
    (segment, idx) => segment === '-' && segments[idx + 1] === 'raw',
  )
  if (url.hostname === 'gitlab.com' && rawMarker >= 2) {
    return `https://${url.hostname}/${segments
      .slice(0, rawMarker + 3)
      .join('/')}/`
  }

  return new URL('.', url).toString()
}

function rewriteRootRelativeToRepo(doc: Document, rawPageUrl: URL) {
  const baseHref = doc.head.querySelector('base')?.getAttribute('href')
  if (!baseHref) {
    return
  }

  let pageBaseUrl: URL
  try {
    pageBaseUrl = new URL(baseHref)
  } catch {
    return
  }

  const repositoryRoot = getRepositoryRoot(rawPageUrl)

  const rootRelativeAttributes = ['src', 'href'] as const
  const $assets = doc.querySelectorAll<HTMLElement>('[src], [href], [content]')

  for (const $asset of $assets) {
    const tagName = $asset.tagName.toLowerCase()
    const keepRootRelativeOnSameOrigin =
      tagName === 'a' ||
      tagName === 'area' ||
      tagName === 'form' ||
      tagName === 'base'

    for (const attr of rootRelativeAttributes) {
      const value = $asset.getAttribute(attr)
      if (!value || !value.startsWith('/')) {
        continue
      }

      // Keep protocol-relative URLs untouched.
      if (value.startsWith('//')) {
        continue
      }

      const resolvedUrl = new URL(value, pageBaseUrl)
      if (
        resolvedUrl.origin === pageBaseUrl.origin &&
        keepRootRelativeOnSameOrigin
      ) {
        continue
      }

      $asset.setAttribute(
        attr,
        new URL(value.slice(1), repositoryRoot).toString(),
      )
    }
  }
}

function deferScriptExecution(doc: Document) {
  const $scripts = doc.querySelectorAll<HTMLScriptElement>('script')

  for (const $script of $scripts) {
    const src = $script.getAttribute('src')
    if (src) {
      let resolvedSrc = src
      try {
        resolvedSrc = new URL(src, doc.baseURI).toString()
      } catch {
        // Keep the original script source when URL parsing fails.
      }

      $script.setAttribute(PREVIEW_SCRIPT_SRC_ATTRIBUTE, resolvedSrc)
      $script.removeAttribute('src')
    }

    const type = $script.getAttribute('type')
    if (type) {
      $script.setAttribute(PREVIEW_SCRIPT_TYPE_ATTRIBUTE, type)
    }

    $script.setAttribute('type', PREVIEW_SCRIPT_PLACEHOLDER_TYPE)
  }
}

export interface HTMLPageData {
  // TODO - move this to a separate file
  title?: string

  // TODO: this is a glorified return type for processHTML, let's split
  // this into a separate type for usage in the UI
  processedHTML: string
}

export function processHTML(html: string, url: string): HTMLPageData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const pageUrl = new URL(url)

  if (!doc.head.querySelector('base')) {
    const base = doc.createElement('base')
    base.setAttribute('href', url)
    doc.head.prepend(base)
  }

  rewriteRootRelativeToRepo(doc, pageUrl)
  rewriteRootRelativeAttributes(doc)
  rewriteRelativeResourceAttributes(doc, pageUrl)
  deferScriptExecution(doc)

  const doctype = serializeDoctype(doc)
  const processedHTML = `${doctype}${doctype ? '\n' : ''}${doc.documentElement.outerHTML}`

  return {
    processedHTML,
    title: getTitle(processedHTML),
  }
}
