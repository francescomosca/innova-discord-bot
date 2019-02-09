import { configure as configureLocale, setLocale } from 'i18n';
import { resolve } from 'path';

import { DiscordBot } from './bot';
import { BotSettings } from './models/bot-settings';
import { logDebug, logError, logWarn } from './utils/logger';
import { settings } from './utils/utils';

configureLocale({
  locales: ['en-us', 'it-it'],
  defaultLocale: 'en-us',
  directory: resolve(__dirname, '../', 'locales'),
  objectNotation: true,
  preserveLegacyCase: true,
  // register: global,
  logDebugFn: (msg) => logDebug('i18n: ' + msg),
  logWarnFn: (msg) => logWarn('i18n: ' + msg),
  logErrorFn: (msg) => logError('i18n: ' + msg)
});
setLocale('en-us'); // default locale

const config: BotSettings = settings();
setLocale(config.language);

(() => new DiscordBot(config))();