import { Message, RichEmbed, StreamDispatcher, VoiceChannel } from 'discord.js';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { SETTINGS } from '../../config/settings.js';
import { ErrorHandler } from '../errorhandler';
import { YtQuery } from '../models/yt-query.js';
import { logDebug, logWarn } from '../utils/logger';
import { BotSettings } from './../models/bot-settings';

export class MusicService {
  private static _instance: MusicService;

  private _player: StreamDispatcher;
  private _currentSongData: YtQuery;
  
  private _config: BotSettings = SETTINGS;

  private constructor() { }

  /** Singleton */
  static getInstance() {
    if (!MusicService._instance) {
      logDebug('MusicService instance created');
      MusicService._instance = new MusicService();
    }
    return MusicService._instance;
  }

  get player(): StreamDispatcher {
    return this._player;
  }
  get currentSongData() {
    return this._currentSongData;
  }

  public resetCurrentSongData = () => this._currentSongData = null;

  public playFromYoutube = async (
    arg: string = '',
    voiceChannel: VoiceChannel,
    message: Message,
  ): Promise<any> => {

    logDebug('ricevuto urlOrText: ' + arg);

    return this.searchFromYoutube(arg).then(
      async (queryObj: YtQuery) => {
        const ytUrl = queryObj.url;
        const isYtUrl: boolean = ytUrl.includes('youtu.be/') || ytUrl.includes('youtube.com/');
        if (isYtUrl) {
          logDebug('isUrl !');

          if (voiceChannel.speakable) voiceChannel.leave();

          voiceChannel.join().then(connection => {
            logDebug('musicQuality: ' + SETTINGS.musicQuality);
            const stream = ytdl(ytUrl, {
              quality: SETTINGS.musicQuality,
              lang: 'it'
            });
            this._player = connection.playStream(stream);

            this._currentSongData = queryObj;
            this.playingEmbed(message);

            message.client.user.setActivity("🎶 " + this._currentSongData.title, { type: "LISTENING" });

            this._player.on('end', () => {
              this._player = null;
              message.client.user.setActivity(this._config.defaultActivity, { type: "LISTENING" });
              // this._currentSongData = null;
              voiceChannel.leave();
            });
            return Promise.resolve();
          }).catch(err => {
            if (voiceChannel.speakable) {
              this._player = null;
              message.client.user.setActivity(this._config.defaultActivity, { type: "LISTENING" });
              // this._currentSongData = null;
              voiceChannel.leave();
            }
            new ErrorHandler(message).byString(err); // ?
          });
        } else logWarn('---- non è un url?');
      })
      .catch(err => {
        new ErrorHandler(message).byError(err); // ?
      });
  }

  async searchFromYoutube(query: string): Promise<string | YtQuery> {
    const searcher: YTSearcher = new YTSearcher(SETTINGS.youtubeKey);
    try {
      const queryResult = await searcher.search(query, { 'maxResults': '1' });
      console.log(queryResult.first);
      if (queryResult && queryResult.first && queryResult.first.url && queryResult.first.url != '') return Promise.resolve(<YtQuery>queryResult.first);
      else return Promise.reject("yt_not_found");
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async playingEmbed(message: Message): Promise<Message | Message[]> {
    const data = this._currentSongData;
    if (!data) return;
    const embed: RichEmbed = new RichEmbed()
      .setColor(3447003)
      .setAuthor(message.client.user.username, message.client.user.avatarURL)
      .setTitle("🎶 Now Playing     ")
      .setDescription(`[${data.title}](${data.url})`)
      .setThumbnail(data.thumbnails.medium.url)
      .setTimestamp(new Date())
      .setFooter(data.channelTitle);
    return message.channel.send({ embed: embed });
  }

}