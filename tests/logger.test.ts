describe('logger', () => {
  const originalNodeEnv = process.env.NODE_ENV

  const loadLoggerForNodeEnv = async (nodeEnv?: string) => {
    jest.resetModules()

    if (nodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = nodeEnv
    }

    const loggerModule = await import('../src/utils/logger')

    return loggerModule.default
  }

  const spyConsole = () => {
    return {
      logSpy: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warnSpy: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      errorSpy: jest.spyOn(console, 'error').mockImplementation(() => {}),
    }
  }

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetModules()

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('routes log messages to console.log', async () => {
    const { logSpy, warnSpy, errorSpy } = spyConsole()
    const logger = await loadLoggerForNodeEnv('development')

    logger.log('hello')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('routes warn messages to console.warn', async () => {
    const { logSpy, warnSpy, errorSpy } = spyConsole()
    const logger = await loadLoggerForNodeEnv('development')

    logger.warn('watch out')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('routes error messages to console.error', async () => {
    const { logSpy, warnSpy, errorSpy } = spyConsole()
    const logger = await loadLoggerForNodeEnv('development')

    logger.error('boom')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('is a no-op in production', async () => {
    const { logSpy, warnSpy, errorSpy } = spyConsole()
    const logger = await loadLoggerForNodeEnv('production')

    logger.log('hello')
    logger.warn('watch out')
    logger.error('boom')

    expect(logSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
