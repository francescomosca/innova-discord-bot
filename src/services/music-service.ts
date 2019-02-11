import { Client, DMChannel, GroupDMChannel, Message, TextChannel, VoiceChannel, VoiceConnection } from 'discord.js';
import { __ } from 'i18n';
import { Observable, Subject, Subscription } from 'rxjs';
import { Readable } from 'stream';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { ErrorHandler } from '../errorhandler';
import { Song } from '../models/song';
import { logDebug, logError, logInfo, logVerbose, logWarn } from '../utils/logger';
import { embed, settings } from '../utils/utils';
import { BotSettings } from './../models/bot-settings';
import { YtQuery } from './../models/yt-query';

export class MusicService {
  private static _instance: MusicService;
  private _config: BotSettings = settings();
  lastVolume: number = 1; // 1 is the default volume (100%)

  private _songs: Song[] = [];
  private _songsSource = new Subject();
  songsChanged$: Observable<{} | Song | Song[]> = this._songsSource.asObservable();

  private _nowPlayingMessage: Message;
  private _voiceConnection: VoiceConnection;

  /** Per la gestione singola delle reazioni. Utilizzato in handleReacts */
  private _reactsListener: Client;
  private _songsSub: Subscription;
  private _stopTotal: boolean;

  /** Singleton */
  private constructor() { }
  static getInstance() {
    if (!MusicService._instance) {
      MusicService._instance = new MusicService();
      logDebug('MusicService instance created');
    }
    return MusicService._instance;
  }

  get currentSong(): Song {
    return this._songs[0];
  }
  get songs(): Song[] {
    return this._songs;
  }
  // public resetCurrentSongData = (): void => this._currentSongData = null;

  /** 1. (vengo chiamato da !play o !add)
   * @param {string} query un url o una stringa da ricercare 
   * @param {VoiceChannel} voiceChannel il canale vocale di chi ha triggerato
   * @param {Message} triggerMsg il messaggio trigger
   * @param {boolean} instant utile per ascoltare una singola canzone, resettando la queue
  */
  addSongs = async (query: string = '', voiceChannel: VoiceChannel, triggerMsg: Message, instant: boolean = false): Promise<any> => {
    logDebug('[playFromYoutube] ricevuto urlOrText: ' + query);

    if (!this._songsSub) this._songsSub = this.songsChanged$.subscribe(
      async songs => {
        logDebug('--- songsChanged$ songs: ' + songs);
        // if (songs == {}) return;
        if (Array.isArray(songs) && !songs.length) {
          if (voiceChannel.speakable) {
            logDebug('speakable, quindi esco');
            voiceChannel.leave();
          }
          return logInfo('[songsChanged$] Nessuna canzone. Esco.');
        }
        return this.play(voiceChannel, triggerMsg);
      },
      err => Promise.reject(err)
    );
    // ////////////////////////////////////

    triggerMsg.channel.send(`:mag_right: ${__("Searching")} \`${query}\``);

    /* 3. do la query a searchFromYoutube che mi ritorna la la YtQuery */
    const songFound: YtQuery = await this.searchFromYoutube(query)
      .catch(err => {
        new ErrorHandler(triggerMsg).byError(err);
        return Promise.reject("command_error");
      });

    if (songFound.liveBroadcastContent == 'live') return Promise.reject('live_content_unsupported');
    if (songFound.title && songFound.url && songFound.thumbnails.default.url) {

      if (instant && this.currentSong && this.currentSong.dispatcher) {
        this.currentSong.dispatcher.end('Another play command was sent');
        this.handleReacts(true); // necessario?
        this._songs = [];
      }

      /* 4. aggiungo la canzone alla queue */
      this._songs.push({
        title: songFound.title,
        url: songFound.url,
        thumbnailUrl: songFound.thumbnails.default.url,
        requestedBy: triggerMsg.author.id
      });

      /* 5. aggiorno lo stato delle canzoni, facendo fare il lavoro sporco a play() */
      if (instant || this._songs.length == 1) this._songsSource.next(this._songs);
      else triggerMsg.channel.send(
        embed.msg(`\`${songFound.title}\` aggiunta alla lista.`)
      );
      // await this.play(userVoiceChannel, playCmdMessage);
    } else Promise.reject('no_data_in_yt_query');
  }

  play = async (userVoiceChannel: VoiceChannel, playCmdMessage: Message) => {
    const song: Song = this.currentSong;

    /* 6. Entro nel canale vocale */
    this._voiceConnection = await userVoiceChannel.join().catch(err => Promise.reject(err));
    logDebug('musicQuality: ' + this._config.musicQuality);

    try {
      const stream: Readable = ytdl(song.url, { quality: this._config.musicQuality });
      /* 7. faccio lo stream di ciò che mi da ytdl */
      song.dispatcher = this._voiceConnection.playStream(stream, { bitrate: 'auto', volume: this.lastVolume }); // @todo vedere seek
      // this._currentSongData = ytSong;

      /* 8. invio l'embed Now Playing e gestisco i reacts */
      this._nowPlayingMessage = await this.playingEmbed(playCmdMessage.channel)
        .catch(err => Promise.reject(err));
      this.handleReacts();

      /* 9. elimino il messaggio trigger !play <> */
      playCmdMessage.deletable ? playCmdMessage.delete() : logDebug("Non ho eliminato il message del comando 'play'");

      song.dispatcher.on('end', reason => {
        /* 10. alla fine dello stream rimuovo la canzone completata, 
          aggiorno i reacts e se c'è un altra canzone, innesco play(), altrimenti esco dal canale vocale */
        logDebug("Player 'end'" + (reason ? ": " + reason : ""));
        this._songs.shift();
        this.handleReacts(true);

        if (this._stopTotal) {
          this._songs = [];
          this._stopTotal = false;
        }

        this._songsSource.next(this._songs);
      });

      return Promise.resolve();
    } catch (err) {
      if (userVoiceChannel.speakable) {
        song.dispatcher = null;
        userVoiceChannel.leave();
      }
      return new ErrorHandler(playCmdMessage).byString(err); // ?
    }
  }

  stop = async (username: string, reason?: string, onlyCurrent: boolean = false) => {
    const song = this.currentSong;
    if (!song) return Promise.reject('no_music_no_stop');
    this._nowPlayingMessage.channel.send(embed.msg('⏹ ' + __("`{{songName}}` stopped by {{user}}",
      { songName: song.title, user: username })));

    if (!onlyCurrent) this._stopTotal = true;

    song.dispatcher.end(reason);
  }

  /**
   * @param  {string} query Un url o una stringa da ricercare.
   * @requires YTSearcher
   * @returns Promise<YtQuery> i dati ricevuti dall'API di YouTube.
   */
  searchFromYoutube = async (query: string, /* nResults: number | string = 1 */): Promise<YtQuery> => {
    // if (typeof nResults == "number") nResults = nResults.toString();
    try {
      const queryResult = await new YTSearcher(this._config.youtubeKey)
        .search(query, { 'maxResults': '1' /* nResults */ });
      logVerbose(JSON.stringify(queryResult.first));

      if (queryResult && queryResult.first && queryResult.first.url && queryResult.first.url != '') {
        return Promise.resolve(<YtQuery>queryResult.first);
      } else return Promise.reject("yt_not_found");
    } catch (err) {
      if (err.message) {
        const braceIndex = String(err.message).indexOf("{");
        const errObj = JSON.parse(String(err.message).slice(braceIndex));
        const errCode = 'google_' + errObj.error.errors[0].reason;
        return Promise.reject(errCode);
      }
      return Promise.reject(err);
    }
  }

  playingEmbed = async (channelOrMsg: TextChannel | DMChannel | GroupDMChannel | Message): Promise<Message> => {
    const data = this.currentSong;
    if (!data) Promise.reject('no data in playingEmbed');

    if (channelOrMsg instanceof Message) channelOrMsg = channelOrMsg.channel;
    const embedMsg = await channelOrMsg.send(embed.nowPlaying(data));

    return Array.isArray(embedMsg) ? embedMsg[0] : embedMsg;
  }
  /**
   * @param  {boolean=false} fromSelf
   * @returns Promise
   * @todo Necessita refactoring
   */
  handleReacts = async (fromSelf: boolean = false): Promise<any> => {
    logDebug('entrato in handleReacts');
    const dispatcher = this.currentSong ? this.currentSong.dispatcher : null;
    const npMsg = this._nowPlayingMessage;

    if (npMsg && npMsg.content) logDebug('Contenuto del messaggio che ascolto: ' + npMsg.content);

    try {
      if (!dispatcher && npMsg) {
        npMsg.client.removeAllListeners('messageReactionAdd');
        await npMsg.clearReactions();
        npMsg.deletable ? await npMsg.delete() : logWarn('Can\'t delete now playing message');
        return;
      } else logDebug('player: ' + String(dispatcher));
      await npMsg.clearReactions();

      if (!fromSelf) { // @todo invertire fromSelf e dare una descrizione migliore
        logDebug('ASCOLTO ON messageReactionAdd');
        this._reactsListener = npMsg.client.on('messageReactionAdd', async (reaction, user) => {
          logDebug(`${user.username} reacted with "${reaction.emoji.name}".`);
          if (user.id == npMsg.author.id) return; // se il bot reagisce, ritorna per il corretto funzionamento del ciclo
          try {
            switch (reaction.emoji.name) {
              case '⏸': {
                dispatcher.pause();
                this.handleReacts(true);
                break;
              }
              case '▶': {
                dispatcher.resume();
                this.handleReacts(true);
                break;
              }
              case '⏹': {
                this.stop(user.username, 'Stopped from reaction');
                // .catch(Promise.reject);
                break;
              }
              case '⏭': {
                this.stop(user.username, 'Skipped from reaction', true);
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

      if (dispatcher) {
        if (!dispatcher.paused) await npMsg.react('⏸');
        else await npMsg.react('▶');
        await npMsg.react('⏹');
        /* if (this._songs.length > 1) */ await npMsg.react('⏭');

      }
    } catch (err) {
      return Promise.reject(err);
    }

  }

}