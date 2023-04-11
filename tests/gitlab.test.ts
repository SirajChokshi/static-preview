import { Gitlab } from '../src/utils/url/gitlab'

const REPO_URL = 'https://gitlab.com/sirajchokshi/static-preview-test'
const BRANCH_URL =
  'https://gitlab.com/sirajchokshi/static-preview-test/-/tree/main'
const DIRECTORY_URL =
  'https://gitlab.com/sirajchokshi/static-preview-test/-/tree/main/assets'
const BLOB_FILE_URL =
  'https://gitlab.com/sirajchokshi/static-preview-test/-/blob/main/index.html'

const SUBGROUP_REPO_URL =
  'https://gitlab.com/sirajchokshi/some-subgroup/static-preview-test'
const SUBGROUP_BLOB_FILE_URL =
  'https://gitlab.com/sirajchokshi/some-subgroup/static-preview-test/-/blob/main/index.html'

const RAW_FILE_URL =
  'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/main/index.html'
const SUBGROUP_RAW_FILE_URL =
  'https://gitlab.com/sirajchokshi/some-subgroup/static-preview-test/-/raw/main/index.html'

describe('[Gitlab] tokenize', () => {
  it('should return a tokenized URL for a repo URL', () => {
    const tokens = Gitlab.tokenize(REPO_URL)

    expect(tokens).toStrictEqual({
      url: new URL(REPO_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: undefined,
      path: undefined,
      file: undefined,
      subGroup: undefined,
    })
  })

  it('should return a tokenized URL for a branch URL', () => {
    const tokens = Gitlab.tokenize(BRANCH_URL)

    expect(tokens).toStrictEqual({
      url: new URL(BRANCH_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: 'main',
      path: undefined,
      file: undefined,
      subGroup: undefined,
    })
  })

  it('should return a tokenized URL for a directory URL', () => {
    const tokens = Gitlab.tokenize(DIRECTORY_URL)

    expect(tokens).toStrictEqual({
      url: new URL(DIRECTORY_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: 'main',
      path: 'assets',
      file: undefined,
      subGroup: undefined,
    })
  })

  it('should return a tokenized URL for a blob URL', () => {
    const tokens = Gitlab.tokenize(BLOB_FILE_URL)

    expect(tokens).toStrictEqual({
      url: new URL(BLOB_FILE_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: 'main',
      path: 'index.html',
      file: 'index.html',
      subGroup: undefined,
    })
  })

  it('should return a tokenized URL for a repo URL with a subgroup', () => {
    const tokens = Gitlab.tokenize(SUBGROUP_REPO_URL)

    expect(tokens).toStrictEqual({
      url: new URL(SUBGROUP_REPO_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: undefined,
      path: undefined,
      file: undefined,
      subGroup: 'some-subgroup',
    })
  })

  it('should return a tokenized URL for a blob URL with a subgroup', () => {
    const tokens = Gitlab.tokenize(SUBGROUP_BLOB_FILE_URL)

    expect(tokens).toStrictEqual({
      url: new URL(SUBGROUP_BLOB_FILE_URL),
      owner: 'sirajchokshi',
      repo: 'static-preview-test',
      branch: 'main',
      path: 'index.html',
      file: 'index.html',
      subGroup: 'some-subgroup',
    })
  })
})

describe('[Gitlab] process', () => {
  it('should return a raw URL for a blob URL', () => {
    const url = Gitlab.process(BLOB_FILE_URL)

    expect(url).toStrictEqual([RAW_FILE_URL])
  })

  it('should return provided raw HTML URL', () => {
    const url = Gitlab.process(RAW_FILE_URL)

    expect(url).toStrictEqual([RAW_FILE_URL])
  })

  it('should return a raw URL for a blob URL with a subgroup', () => {
    const url = Gitlab.process(SUBGROUP_BLOB_FILE_URL)

    expect(url).toStrictEqual([SUBGROUP_RAW_FILE_URL])
  })

  it('should return an array of possible URLs for a repo URL', () => {
    const url = Gitlab.process(REPO_URL)

    expect(url).toStrictEqual([
      'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/master/index.html',
      'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/main/index.html',
    ])
  })

  it('should return an array of possible URLs for a branch URL', () => {
    const url = Gitlab.process(BRANCH_URL)

    expect(url).toStrictEqual([
      'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/main/index.html',
    ])
  })

  it('should return an array of possible URLs for a directory URL', () => {
    const url = Gitlab.process(DIRECTORY_URL)

    expect(url).toStrictEqual([
      'https://gitlab.com/sirajchokshi/static-preview-test/-/raw/main/assets/index.html',
    ])
  })

  it('should return an array of possible URLs for a repo URL with a subgroup', () => {
    const url = Gitlab.process(SUBGROUP_REPO_URL)

    expect(url).toStrictEqual([
      'https://gitlab.com/sirajchokshi/some-subgroup/static-preview-test/-/raw/master/index.html',
      'https://gitlab.com/sirajchokshi/some-subgroup/static-preview-test/-/raw/main/index.html',
    ])
  })
})
