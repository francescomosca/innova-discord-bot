import { Client, Message, StreamDispatcher, VoiceChannel } from 'discord.js';
import { __ } from 'i18n';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { ErrorHandler } from '../errorhandler';
import { setBotActivity } from '../utils/bot-activity';
import { logDebug, logError, logWarn } from '../utils/logger';
import { embed, settings } from '../utils/utils';
import { BotSettings } from './../models/bot-settings';
import { YtQuery } from './../models/yt-query';

/** @todo utilizzare RxJS per ridurre il codice */
export class MusicService {
  private static _instance: MusicService;
  private _config: BotSettings = settings();

  private _player: StreamDispatcher;
  private _currentSongData: YtQuery;
  private _currentNpMessage: Message;

  /** Per la gestione singola delle reazioni. */
  private _reactsListener: Client;

  /** Singleton */
  private constructor() { }
  static getInstance() {
    if (!MusicService._instance) {
      MusicService._instance = new MusicService();
      logDebug('MusicService instance created');
    }
    return MusicService._instance;
  }

  get player(): StreamDispatcher {
    return this._player;
  }
  get currentSongData() {
    return this._currentSongData;
  }

  public resetCurrentSongData = (): void => this._currentSongData = null;

  public playFromYoutube = async (arg: string = '', voiceChannel: VoiceChannel, playCmdMessage: Message): Promise<any> => {
    logDebug('ricevuto urlOrText: ' + arg);

    this.searchFromYoutube(arg).then(async (queryObj: YtQuery) => {
      const ytUrl = queryObj.url;
      const isYtUrl: boolean = ytUrl.includes('youtu.be/') || ytUrl.includes('youtube.com/');
      if (isYtUrl) {
        logDebug('isUrl !');

        if (voiceChannel.speakable) {
          voiceChannel.leave();
          logDebug('speakable, quindi esco');
        }

        const connection = await voiceChannel.join().catch(err => Promise.reject(err));

        try {
          logDebug('musicQuality: ' + this._config.musicQuality);

          const stream = ytdl(ytUrl, { quality: this._config.musicQuality });
          // this._player = connection.playFile(media.path);
          this._player = connection.playStream(stream);

          this._currentSongData = queryObj;

          const npMessage = await this.playingEmbed(playCmdMessage, true).catch(err => Promise.reject(err));
          this._currentNpMessage = npMessage;
          this.handleReacts();


          setBotActivity(playCmdMessage, `🎶 ${this._currentSongData.title}`);

          this._player.on('end', reason => {
            logDebug(__("Player 'end': %s", reason));
            this._player = null;
            this.handleReacts(true);
            setBotActivity(playCmdMessage, "default");
            // this._currentSongData = null;
            voiceChannel.leave();
          });
          return Promise.resolve();
        } catch (err) {
          if (voiceChannel.speakable) {
            this._player = null;
            // this._currentSongData = null;
            voiceChannel.leave();
          }
          setBotActivity(playCmdMessage, "default");
          new ErrorHandler(playCmdMessage).byString(err); // ?
        }

      } else logWarn('---- non è un url?');
    }).catch(err => new ErrorHandler(playCmdMessage).byError(err));
  }

  async searchFromYoutube(query: string): Promise<YtQuery> {
    try {
      const queryResult = await new YTSearcher(this._config.youtubeKey).search(query, { 'maxResults': '1' });
      console.log(queryResult.first);

      if (queryResult && queryResult.first && queryResult.first.url && queryResult.first.url != '') {
        if (queryResult.first.liveBroadcastContent == 'live') return Promise.reject('live_content_unsupported');
        return Promise.resolve(<YtQuery>queryResult.first);
      } else return Promise.reject("yt_not_found");
    } catch (err) {
      return Promise.reject(err);
    }
  }

  playingEmbed = async (triggerMsg: Message, deleteTriggerMsg: boolean = false): Promise<Message> => {
    const data = this._currentSongData;
    if (!data) Promise.reject('no data in playingEmbed');

    const embedMsg = await triggerMsg.channel.send(embed.nowPlaying(data, triggerMsg.author.id));

    if (embedMsg && deleteTriggerMsg) triggerMsg.deletable ? triggerMsg.delete() : logWarn("Non ho potuto eliminare il messaggio del comando 'play'");

    const condition = embedMsg.toString().startsWith('['); // @todo strano che ne abbia bisogno
    logDebug('condition: ' + condition);
    return condition ? embedMsg[0] : embedMsg;
  }

  handleReacts = async (fromSelf: boolean = false): Promise<any> => {
    const npMsg = this._currentNpMessage;
    logDebug('entrato in handleReacts');
    if (npMsg && npMsg.content) logDebug('Contenuto del messaggio che ascolto: ' + npMsg.content);

    try {
      if (!this._player && npMsg) {
        npMsg.client.removeAllListeners('messageReactionAdd');
        await npMsg.clearReactions();
        npMsg.deletable ? await npMsg.delete() : logWarn('Can\'t delete now playing message');
        return;
      } else logDebug('player: ' + String(this._player));
      await npMsg.clearReactions();

      if (!fromSelf) { // @todo invertire fromSelf e dare una descrizione migliore
        logDebug('ASCOLTO ON messageReactionAdd');
        this._reactsListener = npMsg.client.on('messageReactionAdd', async (reaction, user) => {
          logDebug(`${user.username} reacted with "${reaction.emoji.name}".`);
          if (user.id == npMsg.author.id) return; // se il bot reagisce, ritorna per il corretto funzionamento del ciclo
          try {
            switch (reaction.emoji.name) {
              case '⏸': {
                this.player.pause();
                this.handleReacts(true);
                break;
              }
              case '▶': {
                this.player.resume();
                this.handleReacts(true);
                break;
              }
              case '⏹': {
                if (!this.player) return;
                this.player.end('Stopped from reaction');
                npMsg.channel.send(embed.msg('⏹ ' + __("`{{songName}}` stopped by {{user}}",
                  { songName: this._currentSongData.title, user: user.username })))
                  .then(() => this.resetCurrentSongData());
                this.handleReacts(true);
                break;
              }
              default:
                return;
            }
          } catch (err) {
            logError(err);
          }
        });
      }

      if (this._player) {
        if (!this._player.paused) await npMsg.react('⏸');
        else await npMsg.react('▶');
        await npMsg.react('⏹');

      }
    } catch (err) {
      return Promise.reject(err);
    }

  }

}