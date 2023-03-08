import logbench from 'logbench'

const logger = logbench({
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

export default logger
