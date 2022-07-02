import { processedCSS } from './css'

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const IFRAME_ID = '#site-frame'

const proxyFetch = (url: string) =>
  fetch(`https://api.codetabs.com/v1/proxy/?quest=${url}`, undefined).then(
    (res) => {
      if (!res.ok) throw new Error(`Could not load ${url}`)
      return res.text()
    },
  )

const loadData = (data: string, element: string) => {
  // Method to load CSS, JS, and other elements into the preview body.
  const $iframe = document.querySelector<HTMLIFrameElement>(IFRAME_ID)!
  const iframeDocument = ($iframe?.contentWindow ??
    $iframe.contentDocument) as Window

  if (data) {
    const style = iframeDocument.document.createElement(element)
    style.innerHTML = data
    iframeDocument.document.head.appendChild(style)
  }
}

const loadPageElements = () => {
  const $iframe = document.querySelector<HTMLIFrameElement>(IFRAME_ID)!
  const iframeDocument = ($iframe?.contentWindow ??
    $iframe.contentDocument) as Window

  // Next, load CSS for styles
  const $link = iframeDocument.document.querySelectorAll<HTMLLinkElement>(
    'link[rel=stylesheet]',
  )

  const links = [...$link].map(async ({ href }: { href: string }) => {
    const payload = await proxyFetch(href)
    return {
      url: href,
      payload,
    }
  })

  Promise.all(links).then((res) => {
    res.forEach(({ payload, url: cssUrl }) => {
      const processedCSS = processedCSS(payload, cssUrl)
      loadData(processedCSS, 'style')
    })
  })
  // Load page JS
  const $script = iframeDocument.document.querySelectorAll<HTMLScriptElement>(
    'script[type="text/javascript"]',
  )

  const scripts = [...$script].map((s) => {
    const { src } = s
    if (src.includes('//raw.githubusercontent.com')) {
      // TODO: Check if it's from raw.github.com or bitbucket.org
      return proxyFetch(src) // Then add it to scripts queue and fetch using CORS proxy
    }
    s.removeAttribute('type')
    return s.innerHTML // Add inline script to queue to eval in order
  })

  Promise.all(scripts).then((res) => {
    res.forEach((r) => loadData(r, 'script'))

    iframeDocument.document.dispatchEvent(
      new Event('DOMContentLoaded', { bubbles: true, cancelable: true }),
    ) // Dispatch DOMContentLoaded event after loading all scripts
  })
}

const isHTML = (maybeHTML: string) => {
  const $div = document.createElement('div')
  $div.innerHTML = maybeHTML
  return [...$div.childNodes].reverse().some(($child) => $child.nodeType === 1)
}

const loadHTML = async (data: string, url: string) => {
  if (data && isHTML(data)) {
    const processedData = data.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${url}">`,
    )

    setTimeout(() => {
      const $iframe = document.querySelector<HTMLIFrameElement>(IFRAME_ID)!
      const iframeDocument = ($iframe?.contentWindow ??
        $iframe.contentDocument) as Window

      iframeDocument.document.open()
      iframeDocument.document.write(processedData)
      iframeDocument.document.close()
      loadPageElements()
    }, 10)
  }
}

const renderPage = (url: string) => {
  // Check for source uri string, which follows several different cases.

  let processedURL = url

  if (url.includes('.html')) {
    // The user has provided us with an index.html file.
    // Simply return this same URL, as it is our source.
    processedURL = processedURL
      .replace('//github.com/', '//raw.githubusercontent.com/')
      .replace(/\/blob\//, '/') // Get URL of the raw file

    proxyFetch(processedURL)
      .then(async (data) => {
        await loadHTML(data, processedURL)
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
      proxyFetch(u)
        // eslint-disable-next-line no-loop-func
        .then(async (data) => {
          await loadHTML(data, u)
        })
        .catch((error) => {
          console.error(error)
        }),
    ),
  )
}

export default renderPage
