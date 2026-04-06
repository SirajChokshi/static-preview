import { goto } from '$app/navigation'
import { PreviewError, errorType } from './errors'
import { proxyFetch } from './fetch'
import { processCSS } from './lang/css'
import { isHTML, processHTML, type HTMLPageData } from './lang/html'
import logger from './logger'
import { processUrl } from './url'

export class Preview {
  // Parent
  iframeId: string

  // Session
  resources: Record<string, string> = {}

  // TODO - might be worth memoizing against the URL for the session
  pageData: Partial<HTMLPageData> = {}

  constructor(iframeId: string) {
    this.iframeId = iframeId
  }

  get iframe() {
    const el = document.querySelector<HTMLIFrameElement>(this.iframeId)

    if (!el) {
      throw new Error(`Could not find iframe with id: ${this.iframeId}`)
    }

    return el
  }

  get iframeDocument() {
    return (this.iframe?.contentWindow ?? this.iframe.contentDocument) as Window
  }

  async render(url: string) {
    const urls = processUrl(url)

    if (urls.length === 1) {
      // if the URL is an HTML file, we can just load it
      const htmlURL = urls[0]

      this.load(htmlURL)
        .then(async (data) => {
          await this.loadHTML(data, htmlURL)
        })
        .catch(() => {
          throw new PreviewError(
            `Could not find any valid HTML files. Tried:\n${urls.join(
              '\n - ',
            )}`,
            errorType.NOT_FOUND,
          )
        })
    } else {
      // otherwise we have to attempt to load 3 possible URLs
      const errorTable = new Array(urls.length).fill(false)

      await Promise.all(
        urls.map((u, idx) =>
          this.load(u)
            // eslint-disable-next-line no-loop-func
            .then(async (data) => {
              await this.loadHTML(data, u)
            })
            .catch(() => {
              errorTable[idx] = true
            }),
        ),
      )

      if (errorTable.every((e) => e)) {
        throw new PreviewError(
          `Could not find any valid HTML files. Tried:\n${urls.join('\n - ')}`,
          errorType.NOT_FOUND,
        )
      }
    }
  }

  private async loadHTML(data: string, url: string) {
    if (!isHTML(data)) {
      logger.warn(`🚨 Error Loading HTML\nURL: ${url}\nBlob: ${data}`)

      // TODO - use a catchable error, maybe pass up to an error settler in `render`
      throw Error('Not HTML')
    }

    const { processedHTML, title } = processHTML(data, url)

    this.pageData.title = title ?? url

    this.iframeDocument.document.open()
    this.iframeDocument.document.write(processedHTML)
    this.iframeDocument.document.close()

    this.initFrameEvents()
    await this.loadPageElements()
  }

  private async initFrameEvents() {
    this.iframe.addEventListener('load', () => {
      // Add event listeners to iframe
      this.iframeDocument.document.addEventListener('click', (e) => {
        const $el = e.target as HTMLElement
        const $anchor = $el.closest<HTMLAnchorElement>('a')

        if ($anchor) {
          e.preventDefault()

          // TODO: Check if it's a relative link

          // use Svelte navigation to trigger a re-render from the top of the UI
          goto(`/${encodeURIComponent($anchor.href)}`)
        }
      })
    })
  }

  private async loadPageElements() {
    // Load CSS
    const $link =
      this.iframeDocument.document.querySelectorAll<HTMLLinkElement>(
        'link[rel=stylesheet]',
      )
    const links = [...$link].map(async ({ href }: { href: string }) => {
      const payload = await this.load(`${href}`)
      return {
        url: href,
        payload,
      }
    })

    await Promise.all(links).then((res) => {
      res.forEach(({ payload, url: cssUrl }) => {
        const processedCSS = processCSS(payload, cssUrl)
        this.appendToHead(processedCSS, 'style')
      })
    })

    // Load page JS
    const $script =
      this.iframeDocument.document.querySelectorAll<HTMLScriptElement>('script')
    const baseUrl = new URL(this.iframeDocument.document.baseURI)

    const scripts = [...$script].map(async (s) => {
      if (s.hasAttribute('data-static-preview-fetch-resolver')) {
        // Ignore injected resolver script.
        return null
      }

      const type = s.type.toLowerCase()
      const isClassicType =
        type === '' ||
        type === 'text/javascript' ||
        type === 'application/javascript'

      if (!isClassicType) {
        return null
      }

      if (s.src) {
        const srcUrl = new URL(s.src, this.iframeDocument.document.baseURI)

        if (
          srcUrl.origin === baseUrl.origin ||
          srcUrl.hostname === 'raw.githubusercontent.com'
        ) {
          return this.load(srcUrl.href)
        }

        // Let browser handle non-repository script URLs.
        return null
      }

      // Existing support for explicitly text/javascript inline scripts.
      if (type === 'text/javascript') {
        s.removeAttribute('type')
      }

      return s.innerHTML
    })

    await Promise.all(scripts).then((res) => {
      res.forEach((r) => {
        if (r) {
          this.appendToHead(r, 'script')
        }
      })

      this.iframeDocument.document.dispatchEvent(
        new Event('DOMContentLoaded', { bubbles: true, cancelable: true }),
      ) // Dispatch DOMContentLoaded event after loading all scripts
    })
  }

  /**
   * Inline CSS or JS into the preview body
   */
  private appendToHead(data: string, element: 'script' | 'style'): void {
    // Method to load CSS, JS, and other elements into the preview body.

    if (!data) {
      return
    }

    const tag = this.iframeDocument.document.createElement(element)
    tag.innerHTML = data
    this.iframeDocument.document.head.appendChild(tag)
  }

  /**
   * Load a resource from the network and store it in the cache
   */
  private async load(url: string) {
    if (this.resources[url]) {
      // if we already know about this resource, return it
      return this.resources[url]
    }

    // otherwise, fetch it and store it
    const data = await proxyFetch(url)

    this.resources[url] = data

    return data
  }
}
