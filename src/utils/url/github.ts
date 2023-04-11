import type { Lexer, TokenizedUrl } from 'src/types/utils'
import { PreviewError, errorType } from '../errors'
import { resourceType } from '../../types/resources'

class GithubImpl implements Lexer<TokenizedUrl> {
  tokenize(urlStr: string) {
    const url = new URL(urlStr)
    const urlPath = url.pathname.split('/').filter(Boolean)
    const owner = urlPath?.[0]
    const repo = urlPath?.[1]
    const branch = urlPath?.[3]
    const path = urlPath.slice(4).join('/') || undefined

    let file = path && path.split('/')[path.split('/').length - 1]

    if (file && file?.split('.').length < 2) {
      file = undefined
    }

    return { url, owner, repo, branch, path, file }
  }

  process(url: string) {
    const tokens = this.tokenize(url)

    if (tokens.url.hostname === 'raw.githubusercontent.com') {
      // if the URL is already a raw URL, return it
      return [url]
    }

    return this._process(tokens)
  }

  private _process(tokens: TokenizedUrl): string[] {
    const { owner, repo, branch, file } = tokens

    if (!owner || !repo) {
      throw new PreviewError(
        'Not a valid repository URL',
        errorType.URL_ERROR,
        resourceType.GITHUB,
      )
    }

    if (!branch) {
      return ['master', 'main']
        .map(
          // try to find the default branch
          (maybeBranch) => this._process({ ...tokens, branch: maybeBranch }),
        )
        .flat()
    }

    if (file) {
      if (!file.endsWith('.html')) {
        // throw on non-HTML files
        throw new PreviewError(
          'Non-HTML file provided',
          errorType.URL_ERROR,
          resourceType.GITHUB,
        )
      }

      // if there is one file, return it
      return [this._processFile(tokens)]
    }

    // if there's no specified file, find `index.html` in the directory
    return [
      this._processFile({
        ...tokens,
        file: 'index.html',
        // prepend path if it exists
        path: tokens.path ? `${tokens.path}/index.html` : 'index.html',
      }),
    ]
  }

  private _processFile(tokens: TokenizedUrl) {
    return `https://raw.githubusercontent.com/${tokens.owner}/${tokens.repo}/${tokens.branch}/${tokens.path}`
  }
}

export const Github = new GithubImpl()
