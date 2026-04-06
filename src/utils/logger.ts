type LogMessage = unknown

type Logger = {
  log: (message: LogMessage) => void
  warn: (message: LogMessage) => void
  error: (message: LogMessage) => void
}

const noop = () => {}

const formatMessage = (message: LogMessage): string => {
  if (typeof message === 'string') {
    return message
  }

  try {
    return JSON.stringify(message, null, 2)
  } catch {
    return String(message)
  }
}

const styledLogger =
  (logFn: (...data: unknown[]) => void, background: string, color: string) =>
  (message: LogMessage): void => {
    logFn(
      `%c${formatMessage(message)}`,
      `
    font-size: 12px;
    background: ${background};
    color: ${color};
    padding: 5px;
   `,
    )
  }

const isProduction = process.env.NODE_ENV === 'production'

const logger: Logger = isProduction
  ? {
      log: noop,
      warn: noop,
      error: noop,
    }
  : {
      log: styledLogger(console.log, 'black', 'white'),
      warn: styledLogger(console.warn, '#200e00', '#feeada'),
      error: styledLogger(console.error, '#4a0000', '#ffd7d7'),
    }

export default logger
