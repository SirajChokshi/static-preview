import { goto } from '$app/navigation'
import { resourceType } from '../constants/resources'
import { proxyFetch } from './fetch'
import { processCSS } from './lang/css'
import { isHTML, processHTML, type HTMLPageData } from './lang/html'
import logger from './logger'
import { getResourceType, getPossibleUrls, processUrl } from './url'

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
    const urlType = getResourceType(url)

    if (urlType === resourceType.HTML) {
      const htmlURL = processUrl(url)

      this.load(htmlURL)
        .then(async (data) => {
          await this.loadHTML(data, htmlURL)
        })
        .catch((error) => {
          console.error(error)
        })

      // if we are loading a file at this point we can stop here
      return
    }

    // otherwise we have to figure out where the file is in the repo
    const urls: string[] = getPossibleUrls(url)

    const errorTable = {
      main: false,
      master: false,
    }

    await Promise.all(
      urls.map((u) =>
        this.load(u)
          // eslint-disable-next-line no-loop-func
          .then(async (data) => {
            await this.loadHTML(data, u)
          })
          .catch(() => {
            if (u.includes('main')) errorTable.main = true
            if (u.includes('master')) errorTable.master = true
          }),
      ),
    )

    if (errorTable.main && errorTable.master) {
      // TODO: only throw error if the user is attempting to load without a file path
      // throw Error('Could not find index.html on <main> or <master> branch')
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
      this.iframeDocument.document.querySelectorAll<HTMLScriptElement>(
        'script[type="text/javascript"]',
      )

    const scripts = [...$script].map((s) => {
      const { src } = s
      if (src.includes('//raw.githubusercontent.com')) {
        // TODO: Check if it's from raw.github.com or bitbucket.org
        return this.load(src) // Then add it to scripts queue and fetch using CORS proxy
      }
      s.removeAttribute('type')
      return s.innerHTML // Add inline script to queue to eval in order
    })

    await Promise.all(scripts).then((res) => {
      res.forEach((r) => this.appendToHead(r, 'script'))

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
