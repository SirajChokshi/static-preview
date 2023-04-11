export interface TokenizedUrl {
  url: URL
  owner: string
  repo: string
  branch?: string
  path?: string
  file?: string
}

export interface Lexer<T> {
  tokenize(url: string): T
  process(url: string): string[]
}
