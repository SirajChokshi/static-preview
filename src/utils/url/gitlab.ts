import type { Lexer, TokenizedUrl } from 'src/types/utils'
import { PreviewError, errorType } from '../errors'
import { resourceType } from '../../types/resources'

interface GitlabTokenizedUrl extends TokenizedUrl {
  subGroup?: string
}

class GitlabImpl implements Lexer<GitlabTokenizedUrl> {
  tokenize(urlStr: string) {
    const url = new URL(urlStr)
    const urlPath = url.pathname.split('/').filter(Boolean)
    const owner = urlPath?.[0]

    const pathnameAfterOwner = urlPath.join('/')
    const [subGroupAndRepo, branchAndFilepath] = pathnameAfterOwner.split('/-/')

    let [, subGroup, repo]: (string | undefined)[] = subGroupAndRepo
      .split('/')
      .map((s) => (s === '' ? undefined : s))

    if (!repo) {
      repo = subGroup ?? ''
      subGroup = undefined
    }

    const remainingPath = branchAndFilepath?.split('/')

    // remove tree or blob segment
    remainingPath?.shift()

    const branch = remainingPath?.[0]
    const path = remainingPath?.slice(1).join('/') || undefined

    let file = path && path.split('/')[path.split('/').length - 1]

    if (file && file?.split('.').length < 2) {
      file = undefined
    }

    return { url, owner, repo, subGroup, branch, path, file }
  }

  process(url: string) {
    const tokens = this.tokenize(url)

    if (tokens.path?.includes('/-/raw/')) {
      // if the URL is already a raw URL, return it
      return [url]
    }

    return this._process(tokens)
  }

  private _process(tokens: GitlabTokenizedUrl): string[] {
    const { owner, repo, branch, file } = tokens

    if (!owner || !repo) {
      throw new PreviewError(
        'Not a valid repository URL',
        errorType.URL_ERROR,
        resourceType.GITLAB,
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

  private _processFile(tokens: GitlabTokenizedUrl) {
    let urlStr = `https://gitlab.com/${tokens.owner}/`

    if (tokens.subGroup) {
      urlStr += `${tokens.subGroup}/`
    }

    return `${urlStr}${tokens.repo}/-/raw/${tokens.branch}/${tokens.path}`
  }
}

export const Gitlab = new GitlabImpl()
