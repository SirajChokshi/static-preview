import { sleep } from './async'
import { proxyFetch } from './fetch'
import { processCSS } from './lang/css'
import { isHTML, processHTML } from './lang/html'

export class Preview {
  // Parent
  iframeId: string

  // Session
  history = [] as string[]
  resources: Record<string, string> = {}

  constructor(iframeId: string, initialUrl: string) {
    this.iframeId = iframeId

    // Load initial page
    this.render(initialUrl)
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

  render(url: string) {
    this.history.push(url)

    // Check for source uri string, which follows several different cases.
    let processedURL = url

    if (url.includes('.html')) {
      // The user has provided us with an index.html file.
      // Simply return this same URL, as it is our source.
      processedURL = processedURL
        .replace('//github.com/', '//raw.githubusercontent.com/')
        .replace(/\/blob\//, '/') // Get URL of the raw file

      this.load(processedURL)
        .then(async (data) => {
          await this.loadHTML(data, processedURL)
        })
        .catch((error) => {
          console.error(error)
        })
    }
    // Otherwise, we need to check if index.html exists. Try /main/ and /master/.
    processedURL = processedURL
      .replace('//github.com/', '//raw.githubusercontent.com/')
      .replace(/\/blob\//, '/') // Get URL of the raw file

    const urls = [
      `${processedURL}/main/index.html`,
      `${processedURL}/master/index.html`,
    ]

    Promise.all(
      urls.map((u) =>
        this.load(u)
          // eslint-disable-next-line no-loop-func
          .then(async (data) => {
            await this.loadHTML(data, u)
          })
          .catch((error) => {
            console.error(error)
          }),
      ),
    )
  }

  private async loadHTML(data: string, url: string) {
    if (!isHTML(data)) {
      console.log(url, data)
      throw Error('Not HTML')
    }

    const processedData = processHTML(data, url)

    this.iframeDocument.document.open()
    this.iframeDocument.document.write(processedData)
    this.iframeDocument.document.close()

    this.loadPageElements()
    this.initFrameEvents()

    await sleep(10)
  }

  private async initFrameEvents() {
    this.iframe.addEventListener('load', () => {
      // Add event listeners to iframe
      this.iframeDocument.document.addEventListener('click', (e) => {
        const $anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>(
          'a',
        )

        if ($anchor) {
          e.preventDefault()

          // TODO - check if anchor is external
          this.render($anchor.href)
        }
      })
    })
  }

  private loadPageElements() {
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

    Promise.all(links).then((res) => {
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

    Promise.all(scripts).then((res) => {
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
