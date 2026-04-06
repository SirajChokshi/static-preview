import logbench from 'logbench'

type Logger = {
  log: (message: unknown) => void
  warn: (message: unknown) => void
  error: (message: unknown) => void
}

type LogbenchFactory = (options: {
  logFn: (message: unknown) => void
  warnFn: (message: unknown) => void
  isProduction: boolean
}) => Logger

const createLogger = (factory: unknown): Logger => {
  if (typeof factory === 'function') {
    return (factory as LogbenchFactory)({
      logFn: (message: unknown) =>
        console.log(
          `%c${message}`,
          `
    font-size: 12px;
    background: black;
    color: white;
    padding: 5px;
   `,
        ),
      warnFn: (message: unknown) =>
        console.log(
          `%c${message}`,
          `
     font-size: 12px;
     background: #200e00;
     color: #feeada; 
     padding: 5px;
    `,
        ),
      isProduction: process.env.NODE_ENV === 'production',
    })
  }

  // Fallback for environments where the default export shape differs.
  return {
    log: (message) => console.log(message),
    warn: (message) => console.warn(message),
    error: (message) => console.error(message),
  }
}

const factory =
  typeof logbench === 'function'
    ? logbench
    : (logbench as { default?: unknown }).default

export default createLogger(factory)
