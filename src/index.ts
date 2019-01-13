import { logDebug, logWarn, logError } from './utils/logger';
import { DiscordBot } from './bot';
import path = require('path');
import i18n = require("i18n");

import { SETTINGS } from '../config/settings.js';

i18n.configure({
  locales: ['en-us', 'it-it'],
  defaultLocale: 'en-us',
  directory: path.resolve(__dirname, '../', 'locales'),
  objectNotation: true,
  preserveLegacyCase: true,
  // register: global,
  // default to require('debug')('i18n:debug')
  logDebugFn: (msg) => logDebug('i18n: ', msg),
  logWarnFn: (msg) => logWarn('i18n: ', msg),
  logErrorFn: (msg) => logError('i18n: ', msg)
});

// @todo controllare correttezza dei config, poi:
i18n.setLocale(SETTINGS.language);
new DiscordBot().init();