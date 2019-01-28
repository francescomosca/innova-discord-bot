import fs = require('fs');
import { __ } from 'i18n';

import { createLogger, format, transports } from 'winston';
import dailyRotateFile = require('winston-daily-rotate-file');

const logDir = 'log';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = format.printf(log => {
  return `${log.label}|${log.level}: ${log.message}`; // ${log.timestamp} 
});

const transportsData = {
  console: new transports.Console({
    level: 'info',
    format: format.combine(
      // format.timestamp({
      //   format: 'DD-MM-YY HH:mm:ss'
      // }),
      format.label({ label: 'InnovaBot' }),
      format.colorize({ all: true }),
      logFormat,
    )
  }),
  file: new dailyRotateFile({
    filename: `${logDir}/%DATE%.log`,
    datePattern: 'DD-MM-YYYY',
    level: 'verbose',
    maxFiles: '31d',
    maxSize: "128m"
  })
};

const logger = createLogger({
  transports: [
    transportsData.console,
    transportsData.file
  ]
});

export const logInfo = (text: string, data?: any) => logger
  .log('info', text, data ? data : undefined);
export const logWarn = (text: string, data?: any) => logger
  .log('warn', text, data ? data : undefined);
export const logError = (text: string, data?: any) => logger
  .log('error', text, data ? data : undefined);
export const logDebug = (text: string, data?: any) => logger
  .log('debug', text, data ? data : undefined);
export const logVerbose = (text: string, data?: any) => logger
  .log('verbose', text, data ? data : undefined);

export const setLogLevel = (level: string) => {
  // Object.keys(transports).forEach(key => transports[key].level = level);
  transportsData.console.level = level;
  logInfo(__('Log level set to %s', level));
};