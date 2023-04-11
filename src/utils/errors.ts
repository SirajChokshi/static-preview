import type { resourceType } from '../types/resources'

export enum errorType {
  URL_ERROR = 'URL_ERROR',
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
