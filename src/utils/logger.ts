const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');

const logDir = 'log';

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const transportsData = {
  console: new transports.Console({ 
    level: 'info', 
    timestamp: true 
  }),
  file: new transports.DailyRotateFile({
    filename: `${logDir}/%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    level: 'debug',
  })
};

const logger = createLogger({
  transports: [
    transportsData.console,
    transportsData.file
  ],
  format: format.combine(
    format.colorize({ all: true }),
    format.simple()
  )
});

export const logInfo = (text: string, data?: any) => logger
  .log('info', text, data ? data : undefined);
export const logWarn = (text: string, data?: any) => logger
  .log('warn', text, data ? data : undefined);
export const logError = (text: string, data?: any) => logger
  .log('error', text, data ? data : undefined);
export const logVerbose = (text: string, data?: any) => logger
  .log('verbose', text, data ? data : undefined);

export const setLogLevel = (level: string) => {
  // Object.keys(transports).forEach(key => transports[key].level = level);
  transportsData['console'].level = level;
  logInfo('Log level set to ' + level);
  logInfo('---------------------------');
};