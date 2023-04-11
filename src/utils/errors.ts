import type { resourceType } from '../types/resources'

export enum errorType {
  URL_ERROR = 'URL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  NOT_HTML = 'NOT_HTML',
}

export class PreviewError extends Error {
  constructor(
    message: string,
    public type?: errorType,
    public platform?: resourceType,
  ) {
    super(message)
  }
}
