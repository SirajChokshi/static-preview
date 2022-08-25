// replace paths relative to stylesheets with absolute paths
function replaceRelativePaths(css: string, url: string) {
  const processedCSS = css.replace(/url\((.*?)\)/g, (_match, relativePath) => {
    // remove quotes
    if (relativePath.startsWith('"') || relativePath.startsWith("'")) {
      relativePath = relativePath.substring(1, relativePath.length - 1)
    }

    const resourcePath = relativePath.split('/')
    const stylesheetPath = url.split('/')

    // ignore absolute paths
    if (resourcePath[0] === 'https:' || resourcePath[0] === 'http:') {
      return `url(${relativePath})`
    }

    // remove current file
    stylesheetPath.pop()

    // remove backtracking
    // TODO: support backtracking after beginning of path
    // e.g. '../path/../file.png'
    while (resourcePath[0] === '..') {
      stylesheetPath.pop()
      resourcePath.shift()
    }

    // join paths
    const absolutePath = stylesheetPath.concat(resourcePath).join('/')

    return `url('${absolutePath}')`
  })
  return processedCSS
}

export function processCSS(css: string, url: string) {
  return replaceRelativePaths(css, url)
}
