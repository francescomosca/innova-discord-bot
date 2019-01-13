/**
 * Modello dei settaggi.
 * 
 * In mancanza di una configurazione, verranno utilizzati i valori di default.
 */
export class BotSettings {
  botName: string = 'DiscordBot';
  token: string = 'BOT_TOKEN';
  youtubeKey: string = 'YOUTUBE_KEY';
  prefix: string = '!';
  defaultActivity: string = '> !play';
  language: string = 'en-us';
  logLevel: string = 'info';
  musicQuality: BotSettings.MusicQuality = 'highestaudio';
  helpInDm: boolean = false;
}

export namespace BotSettings {
  export type MusicQuality = "highestaudio" | "lowestaudio";
  export const category = {
    highestaudio: <MusicQuality>"highestaudio",
    lowestaudio: <MusicQuality>"lowestaudio",
  };
}
