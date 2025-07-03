import winston, { type Logger } from 'winston';

let logger: Logger | undefined;

export default ({
  message,
  requestID,
  level = 'info',
}: {
  message: string,
  requestID: string,
  level?: 'info' | 'warn' | 'error',
}): void => {
  // process.env is only (correctly) available when the function is called, not outside of the
  // export; we can therefore not instantiate the logger outside of the exported function.
  if (!logger) {
    const filename = process.env.LOG_FILE_PATH;
    if (filename) {
      logger = winston.createLogger({
        transports: [
          new winston.transports.Console(),
          new winston.transports.File({
            filename,
            // 100 MB
            maxsize: 1024 * 1024 * 100,
            // 20 × 100 MB = 2 GB
            maxFiles: 20,
          }),
        ],
      });
      console.log('Persist logs to %s', filename);
    } else {
      logger = winston.createLogger({
        transports: [new winston.transports.Console()],
      });
      console.log('No log file path provided; logs will not be persisted');
    }
  }

  logger.log({
    level,
    message: `Request ${requestID}: ${message}`,
  });
};
