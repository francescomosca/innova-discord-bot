/**
 * Tipo dei settaggi.
 * 
 * In mancanza di una configurazione, verranno utilizzati i valori di default.
 */
export class BotSettings {
  botName: string = 'DiscordBot';
  token: string = 'BOT_TOKEN';
  prefix: string = '!';
  activity: string = '> Use !ping';
  language: string = 'en-us';
  logLevel: string = 'info';
}
