import logger from '../src/utils/logger'

describe('logger', () => {
  const originalNodeEnv = process.env.NODE_ENV
  let logSpy: jest.SpyInstance
  let warnSpy: jest.SpyInstance
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    process.env.NODE_ENV = originalNodeEnv
  })

  it('routes log messages to console.log', () => {
    logger.log('hello')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('routes warn messages to console.warn', () => {
    logger.warn('watch out')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('routes error messages to console.error', () => {
    logger.error('boom')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
