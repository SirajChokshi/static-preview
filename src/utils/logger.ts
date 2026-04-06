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
  (method: 'log' | 'warn' | 'error', background: string, color: string) =>
  (message: LogMessage): void => {
    console[method](
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
      log: styledLogger('log', 'black', 'white'),
      warn: styledLogger('warn', '#200e00', '#feeada'),
      error: styledLogger('error', '#4a0000', '#ffd7d7'),
    }

export default logger
