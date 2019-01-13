import { Message, StreamDispatcher, VoiceChannel } from 'discord.js';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { SETTINGS } from '../../config/settings.js';
import { ErrorHandler } from '../errorhandler';
import { logDebug } from '../utils/logger';

export class MusicService {
  private static _instance: MusicService;

  private _streamDispatcher: StreamDispatcher;

  private constructor() { }

  /** Singleton */
  static getInstance() {
    if (!MusicService._instance) {
      logDebug('MusicService instance created');
      MusicService._instance = new MusicService();
    }
    return MusicService._instance;
  }

  get streamDispatcher(): StreamDispatcher {
    return this._streamDispatcher;
  }

  public playFromYoutube = async (
    urlOrText: string = '',
    voiceChannel: VoiceChannel,
    message: Message,
    fromSelf?: boolean
  ): Promise<any> => {
    if (voiceChannel.speakable) voiceChannel.leave();

    logDebug('ricevuto urlOrText: ' + urlOrText);
    const isYtUrl: boolean = urlOrText.includes('youtu.be/') || urlOrText.includes('youtube.com/');
    if (isYtUrl) {
      logDebug('isUrl !');
      voiceChannel.join().then(connection => {
        logDebug('musicQuality: ' + SETTINGS.musicQuality);
        const stream = ytdl(urlOrText, {
          quality: SETTINGS.musicQuality,
          lang: 'it'
        });
        this._streamDispatcher = connection.playStream(stream);

        this._streamDispatcher.on('end', () => {
          this._streamDispatcher = null;
          voiceChannel.leave();
        });
        return Promise.resolve();
      }).catch(err => {
        if (voiceChannel.speakable) {
          this._streamDispatcher = null;
          voiceChannel.leave();
        }
        new ErrorHandler(message).byString(err); // ?
      });
    } else {
      logDebug('Not an url, ricerco...');
      this.searchFromYoutube(urlOrText).then(
        async url => {
          return !fromSelf ? this.playFromYoutube(url, voiceChannel, message, true)
            .catch(err => err)
            : Promise.reject('yt_not_found');
        })
        .catch(err => {
          new ErrorHandler(message).byError(err); // ?
        });
    }
  }

  async searchFromYoutube(query: string): Promise<string> {
    const searcher: YTSearcher = new YTSearcher(SETTINGS.youtubeKey);
    try {
      const search = await searcher.search(query, { 'maxResults': '1' });
      if (search && search.first && search.first.url && search.first.url != '') return Promise.resolve(search.first.url);
      else return Promise.reject("yt_not_found");
    } catch (err) {
      return Promise.reject(err);
    }
  }

}