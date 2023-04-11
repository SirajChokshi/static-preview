import { Github } from '../src/utils/url/github'

const REPO_URL = 'https://github.com/SirajChokshi/DelineatedTheme'
const BRANCH_URL = 'https://github.com/SirajChokshi/DelineatedTheme/tree/master'
const DIRECTORY_URL =
  'https://github.com/SirajChokshi/DelineatedTheme/tree/master/assets'
const BLOB_FILE_URL =
  'https://github.com/SirajChokshi/DelineatedTheme/blob/master/index.html'
const RAW_FILE_URL =
  'https://raw.githubusercontent.com/SirajChokshi/DelineatedTheme/master/index.html'

describe('[Github] tokenize', () => {
  it('should return a tokenized URL for a repo URL', () => {
    const tokens = Github.tokenize(REPO_URL)

    expect(tokens).toStrictEqual({
      url: new URL(REPO_URL),
      owner: 'SirajChokshi',
      repo: 'DelineatedTheme',
      branch: undefined,
      path: undefined,
      file: undefined,
    })
  })

  it('should return a tokenized URL for a branch URL', () => {
    const tokens = Github.tokenize(BRANCH_URL)

    expect(tokens).toStrictEqual({
      url: new URL(BRANCH_URL),
      owner: 'SirajChokshi',
      repo: 'DelineatedTheme',
      branch: 'master',
      path: undefined,
      file: undefined,
    })
  })

  it('should return a tokenized URL for a directory URL', () => {
    const tokens = Github.tokenize(DIRECTORY_URL)

    expect(tokens).toStrictEqual({
      url: new URL(DIRECTORY_URL),
      owner: 'SirajChokshi',
      repo: 'DelineatedTheme',
      branch: 'master',
      path: 'assets',
      file: undefined,
    })
  })

  it('should return a tokenized URL for a blob URL', () => {
    const tokens = Github.tokenize(BLOB_FILE_URL)

    expect(tokens).toStrictEqual({
      url: new URL(BLOB_FILE_URL),
      owner: 'SirajChokshi',
      repo: 'DelineatedTheme',
      branch: 'master',
      path: 'index.html',
      file: 'index.html',
    })
  })
})

describe('[Github] process', () => {
  it('should return a raw URL for a blob URL', () => {
    const url = Github.process(BLOB_FILE_URL)

    expect(url).toStrictEqual([RAW_FILE_URL])
  })

  it('should return provided raw HTML URL', () => {
    const url = Github.process(RAW_FILE_URL)

    expect(url).toStrictEqual([RAW_FILE_URL])
  })

  it('should return an array of possible URLs for a repo URL', () => {
    const url = Github.process(REPO_URL)

    expect(url).toStrictEqual([
      'https://raw.githubusercontent.com/SirajChokshi/DelineatedTheme/master/index.html',
      'https://raw.githubusercontent.com/SirajChokshi/DelineatedTheme/main/index.html',
    ])
  })

  it('should return an array of possible URLs for a branch URL', () => {
    const url = Github.process(BRANCH_URL)

    expect(url).toStrictEqual([
      'https://raw.githubusercontent.com/SirajChokshi/DelineatedTheme/master/index.html',
    ])
  })

  it('should return an array of possible URLs for a directory URL', () => {
    const url = Github.process(DIRECTORY_URL)

    expect(url).toStrictEqual([
      'https://raw.githubusercontent.com/SirajChokshi/DelineatedTheme/master/assets/index.html',
    ])
  })
})
