import logbench from 'logbench'

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

const logger = isBrowser
  ? logbench({
      logFn: (message) =>
        console.log(
          `%c${message}`,
          `
    font-size: 12px;
    background: black;
    color: white;
    padding: 5px;
   `,
        ),
      warnFn: (message) =>
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
  : {
      log: () => {},
      warn: () => {},
      time: () => {},
      timeEnd: () => {},
    }

export default logger
