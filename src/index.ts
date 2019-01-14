import i18n = require('i18n');
import path = require('path');

import { DiscordBot } from './bot';
import { logDebug, logError, logWarn } from './utils/logger';
import { settings } from './utils/utils';

i18n.configure({
  locales: ['en-us', 'it-it'],
  defaultLocale: 'en-us',
  directory: path.resolve(__dirname, '../', 'locales'),
  objectNotation: true,
  preserveLegacyCase: true,
  // register: global,
  // default to require('debug')('i18n:debug')
  logDebugFn: (msg) => logDebug('i18n: ' + msg),
  logWarnFn: (msg) => logWarn('i18n: ' + msg),
  logErrorFn: (msg) => logError('i18n: ' + msg)
});

// @todo controllare correttezza dei config, poi:
i18n.setLocale(settings().language);
new DiscordBot().init();