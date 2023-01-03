export const proxyFetch = (url: string) =>
  fetch(`https://api.codetabs.com/v1/proxy/?quest=${url}`, undefined).then(
    (res) => {
      if (!res.ok) throw new Error(`Could not load ${url}`)
      return res.text()
    },
  )
