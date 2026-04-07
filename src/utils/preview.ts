import { goto } from '$app/navigation'
import { PreviewError, errorType } from './errors'
import { proxyFetch } from './fetch'
import { processCSS } from './lang/css'
import {
  isHTML,
  PREVIEW_SCRIPT_PLACEHOLDER_TYPE,
  PREVIEW_SCRIPT_SRC_ATTRIBUTE,
  PREVIEW_SCRIPT_TYPE_ATTRIBUTE,
  processHTML,
  type HTMLPageData,
} from './lang/html'
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

      try {
        const data = await this.load(htmlURL)
        await this.loadHTML(data, htmlURL)
      } catch {
        throw new PreviewError(
          `Could not find any valid HTML files. Tried:\n${urls.join('\n - ')}`,
          errorType.NOT_FOUND,
        )
      }
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
        const href = $anchor?.getAttribute('href')

        if (!$anchor || !href || href.startsWith('#')) {
          return
        }

        let resolvedUrl: URL
        try {
          resolvedUrl = new URL(href, this.iframeDocument.location.href)
        } catch {
          return
        }

        // Keep external links inside the iframe navigation flow.
        if (!this.isProxySupportedUrl(resolvedUrl.toString())) {
          return
        }

        e.preventDefault()

        // use Svelte navigation to trigger a re-render from the top of the UI
        goto(`/${encodeURIComponent(resolvedUrl.toString())}`)
      })
    })
  }

  private async loadPageElements() {
    // Load CSS
    const $link =
      this.iframeDocument.document.querySelectorAll<HTMLLinkElement>(
        'link[rel=stylesheet]',
      )
    const links = [...$link]
      .map(({ href }) => href)
      .filter((href) => this.shouldProxyStylesheet(href))
      .map(async (href) => {
        const payload = await this.load(href)
        return {
          url: href,
          payload,
        }
      })

    const stylesheetResults = await Promise.allSettled(links)
    stylesheetResults.forEach((result) => {
      if (result.status !== 'fulfilled') {
        logger.warn(`Skipping stylesheet after failed fetch: ${result.reason}`)
        return
      }

      const { payload, url: cssUrl } = result.value
      const processedCSS = processCSS(payload, cssUrl)
      this.appendToHead(processedCSS, 'style')
    })

    // Load page JS
    const scriptSelector = `script[src], script[type="${PREVIEW_SCRIPT_PLACEHOLDER_TYPE}"]`
    const $script =
      this.iframeDocument.document.querySelectorAll<HTMLScriptElement>(
        scriptSelector,
      )

    for (const script of [...$script]) {
      const source =
        script.getAttribute(PREVIEW_SCRIPT_SRC_ATTRIBUTE) ?? script.src ?? ''
      const scriptType =
        script
          .getAttribute(PREVIEW_SCRIPT_TYPE_ATTRIBUTE)
          ?.toLowerCase()
          .trim() ?? script.getAttribute('type')?.toLowerCase().trim()
      const type = scriptType === 'module' ? ('module' as const) : undefined
      const inlinePayload = script.textContent ?? ''

      script.remove()

      if (source) {
        if (this.shouldProxyScript(source)) {
          try {
            const payload = await this.load(source)
            this.appendScriptToHead(payload, type)
          } catch (err) {
            logger.warn(`Skipping script after failed fetch: ${err}`)
          }
          continue
        }

        try {
          await this.appendExternalScriptToHead(source, type)
        } catch (err) {
          logger.warn(`Skipping script after failed external load: ${err}`)
        }
        continue
      }

      this.appendScriptToHead(inlinePayload, type)
    }

    this.iframeDocument.document.dispatchEvent(
      new Event('DOMContentLoaded', { bubbles: true, cancelable: true }),
    ) // Dispatch DOMContentLoaded event after loading all scripts
  }

  /**
   * Determine whether a script source should be fetched via proxy.
   */
  private shouldProxyStylesheet(href: string): boolean {
    return this.isProxySupportedUrl(href)
  }

  /**
   * Determine whether a script source should be fetched via proxy.
   */
  private shouldProxyScript(src: string): boolean {
    return this.isProxySupportedUrl(src)
  }

  private isProxySupportedUrl(url: string): boolean {
    return (
      url.includes('//raw.githubusercontent.com') || url.includes('/-/raw/')
    )
  }

  /**
   * Inline CSS into the preview head.
   */
  private appendToHead(data: string, element: 'style'): void {
    // Method to load CSS into the preview head.

    if (!data) {
      return
    }

    const tag = this.iframeDocument.document.createElement(element)
    tag.textContent = data
    this.iframeDocument.document.head.appendChild(tag)
  }

  /**
   * Inline JS into the preview head.
   */
  private appendScriptToHead(data: string, type?: 'module'): void {
    if (!data) {
      return
    }

    const tag = this.iframeDocument.document.createElement('script')

    if (type) {
      tag.type = type
    }

    tag.textContent = data
    this.iframeDocument.document.head.appendChild(tag)
  }

  private appendExternalScriptToHead(
    src: string,
    type?: 'module',
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tag = this.iframeDocument.document.createElement('script')

      if (type) {
        tag.type = type
      }

      tag.onload = () => resolve()
      tag.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      tag.src = src
      this.iframeDocument.document.head.appendChild(tag)
    })
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
