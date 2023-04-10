export const proxyFetch = (url: string) =>
  fetch(`https://api.codetabs.com/v1/proxy/?quest=${url}`, undefined).then(
    (res) => {
      if (!res.ok) throw new Error(`Could not load ${url}`)
      // TODO - handle 404s/pageful errors
      // if (res.status === 404) return null
      return res.text()
    },
  )
