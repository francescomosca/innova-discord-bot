import { Message, RichEmbed, StreamDispatcher, VoiceChannel, Client, ColorResolvable } from 'discord.js';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { ErrorHandler } from '../errorhandler';
import { YtQuery } from '../models/yt-query.js';
import { setBotActivity } from '../utils/bot-activity';
import { logDebug, logWarn, logError } from '../utils/logger';
import { BotSettings } from './../models/bot-settings';
import { settings } from '../utils/utils';
import { __ } from 'i18n';

export class MusicService {
  private static _instance: MusicService;

  private _player: StreamDispatcher;
  private _currentSongData: YtQuery;
  private _reactsListener: Client;
  private _currentNpMessage: Message;

  private _config: BotSettings = settings();

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

  public playFromYoutube = async (arg: string = '', voiceChannel: VoiceChannel, playCmdMessage: Message): Promise<any> => {
    logDebug('ricevuto urlOrText: ' + arg);

    return this.searchFromYoutube(arg).then(
      async (queryObj: YtQuery) => {
        const ytUrl = queryObj.url;
        const isYtUrl: boolean = ytUrl.includes('youtu.be/') || ytUrl.includes('youtube.com/');
        if (isYtUrl) {
          logDebug('isUrl !');

          if (voiceChannel.speakable) voiceChannel.leave();

          voiceChannel.join().then(async connection => {
            logDebug('musicQuality: ' + this._config.musicQuality);
            const ytdlOptions: ytdl.downloadOptions = {
              quality: this._config.musicQuality
            };

            const stream = ytdl(ytUrl, ytdlOptions);
            // this._player = connection.playFile(media.path);
            this._player = connection.playStream(stream);

            this._currentSongData = queryObj;
            this.playingEmbed(playCmdMessage, true).then(npMessage => {
              this._currentNpMessage = npMessage;
              this.handleReacts();
            }).catch(err => Promise.reject(err));

            setBotActivity(playCmdMessage, `🎶 ${this._currentSongData.title}`);

            this._player.on('end', () => {
              this._player = null;
              this.handleReacts(true);
              setBotActivity(playCmdMessage, "default");
              // this._currentSongData = null;
              voiceChannel.leave();
            });
            return Promise.resolve();
          }).catch(err => {
            if (voiceChannel.speakable) {
              this._player = null;
              // this._currentSongData = null;
              voiceChannel.leave();
            }
            setBotActivity(playCmdMessage, "default");
            new ErrorHandler(playCmdMessage).byString(err); // ?
          });
        } else logWarn('---- non è un url?');
      })
      .catch(err => {
        new ErrorHandler(playCmdMessage).byError(err); // ?
      });
  }

  async searchFromYoutube(query: string): Promise<string | YtQuery> {
    const searcher: YTSearcher = new YTSearcher(this._config.youtubeKey);
    try {
      const queryResult = await searcher.search(query, { 'maxResults': '1' });
      console.log(queryResult.first);
      if (queryResult && queryResult.first && queryResult.first.url && queryResult.first.url != '') return Promise.resolve(<YtQuery>queryResult.first);
      else return Promise.reject("yt_not_found");
    } catch (err) {
      return Promise.reject(err);
    }
  }

  playingEmbed = async (playCmdMessage: Message, deleteMessage?: boolean): Promise<Message> => {
    const data = this._currentSongData;
    if (!data) return;
    const embed: RichEmbed = new RichEmbed()
      .setColor(<ColorResolvable>27808)
      // .setAuthor(message.client.user.username, message.client.user.avatarURL)
      .setTitle("🎶 Now Playing ")
      .setDescription(`[${data.title}](${data.url})\nRequested by: <@${playCmdMessage.author.id}>`)
      .setThumbnail(data.thumbnails.default.url)
      .setTimestamp(new Date())
      .setFooter(playCmdMessage.client.user.username + ' v' + process.env.npm_package_version);

    const msgSent = await playCmdMessage.channel.send({ embed: embed });

    if (msgSent && deleteMessage) playCmdMessage.deletable ? playCmdMessage.delete() : logWarn("Non ho potuto eliminare il messaggio del comando 'play'");

    const condition = msgSent.toString().startsWith('['); // @todo strano che ne abbia bisogno
    logDebug('condition: ' + condition);
    return condition ? msgSent[0] : msgSent;
  }

  handleReacts = async (fromSelf?: boolean): Promise<any> => {
    const npMessage = this._currentNpMessage;
    logDebug('entrato in handleReacts');
    logDebug('Contenuto del messaggio che ascolto: ' + npMessage.content);
    /* const musicReacts: Array<{ name: string, emoji: string }> = [
      { name: 'pause', emoji: '⏸' },
      { name: 'resume', emoji: '▶' },
      { name: 'stop', emoji: '⏹' }
    ];
    
    const awaitFilter = (reaction, user) => {
      // tslint:disable-next-line:prefer-const
      let emojis: string[] = [];
      musicReacts.forEach(react => emojis.push(react.emoji));
      return emojis.includes(reaction.emoji.name) && user.id === message.author.id;
    }; */

    try {
      if (!this._player) {
        npMessage.client.removeAllListeners('messageReactionAdd');
        await npMessage.clearReactions();
        npMessage.deletable ? await npMessage.delete() : logWarn('Can\'t delete now playing message');
        return;
      } else logDebug('player: ' + String(this._player));
      await npMessage.clearReactions();

      if (!fromSelf) { // @todo invertire fromSelf e dare una descrizione migliore
        logDebug('ASCOLTO ON messageReactionAdd');
        this._reactsListener = npMessage.client.on('messageReactionAdd', async (reaction, user) => {
          logDebug(`${user.username} reacted with "${reaction.emoji.name}".`);
          if (user.id == npMessage.author.id) return; // se il bot reagisce, ritorna per il corretto funzionamento del ciclo
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
                npMessage.channel.send('⏹ ' + __("Song {{songName}} stopped by {{user}}",
                  { songName: '`' + this._currentSongData.title + '`', user: user.username }))
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
        if (!this._player.paused) await npMessage.react('⏸');
        else await npMessage.react('▶');
        await npMessage.react('⏹');

      }
    } catch (err) {
      return Promise.reject(err);
    }

  }

}