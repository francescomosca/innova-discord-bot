import {
  Client,
  DMChannel,
  GroupDMChannel,
  Message,
  StreamDispatcher,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import { __ } from 'i18n';
import { Observable, Subject } from 'rxjs';
import { Readable } from 'stream';
import ytdl = require('ytdl-core');
import { YTSearcher } from 'ytsearcher';

import { ErrorHandler } from '../errorhandler';
import { logDebug, logError, logVerbose, logWarn } from '../utils/logger';
import { embed, settings } from '../utils/utils';
import { BotSettings } from './../models/bot-settings';
import { YtQuery } from './../models/yt-query';

export interface Song {
  title: string;
  url: string;
  thumbnailUrl: string;
  dispatcher?: StreamDispatcher;
  requestedBy: string;
}

export class MusicService {
  private static _instance: MusicService;
  private _config: BotSettings = settings();

  private _songs: Song[] = [];
  private _songsSource = new Subject();
  songs$: Observable<{} | Song | Song[]> = this._songsSource.asObservable();

  private _nowPlayingMessage: Message;
  private _voiceConnection: VoiceConnection;

  /** Per la gestione singola delle reazioni. Utilizzato in handleReacts */
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

  get currentSong(): Song {
    return this._songs[0];
  }
  // public resetCurrentSongData = (): void => this._currentSongData = null;

  /* 1. vengo chiamato da !play che mi manda un url o una stringa da ricercare */
  addSongs = async (query: string = '', requestedBy: string): Promise<any> => {
    logDebug('[playFromYoutube] ricevuto urlOrText: ' + query);

    /* 2. do la query a searchFromYoutube che mi ritorna la la YtQuery */
    const songFound: YtQuery = await this.searchFromYoutube(query)
      .catch(err => Promise.reject(err));

    if (songFound.liveBroadcastContent == 'live') return Promise.reject('live_content_unsupported');
    if (songFound.title && songFound.url && songFound.thumbnails.default.url) {

      /* 3. aggiungo la canzone alla queue */
      this._songs.push({
        title: songFound.title,
        url: songFound.url,
        thumbnailUrl: songFound.thumbnails.default.url,
        requestedBy: requestedBy
      });

      /* 4. aggiorno lo stato delle canzoni, facendo fare il lavoro sporco a play() */
      this._songsSource.next(this._songs);
      // await this.play(userVoiceChannel, playCmdMessage);
    } else Promise.reject('no_data_in_youtube_query');
  }

  play = async (userVoiceChannel: VoiceChannel, playCmdMessage: Message) => {
    const song = this.currentSong;

    /* 10. Se non ci sono altre canzoni, esco dal canale vocale */
    if (!song && userVoiceChannel.speakable) {
      logDebug('nessuna song e speakable, quindi esco');
      userVoiceChannel.leave();
      return;
    }
    // /* 5. se esiste il player 'lo finisco', e aggiorno i reacts */
    // if (song.dispatcher) {
    //   song.dispatcher.end('Another play command was sent');
    //   this.handleReacts(true); // necessario?
    // }

    /* 5. Entro nel canale vocale */
    this._voiceConnection = await userVoiceChannel.join().catch(err => Promise.reject(err));
    logDebug('musicQuality: ' + this._config.musicQuality);

    try {
      const stream: Readable = ytdl(song.url, { quality: this._config.musicQuality });
      /* 6. faccio lo stream di ciò che mi da ytdl */
      song.dispatcher = this._voiceConnection.playStream(stream, { bitrate: 'auto' }); // @todo vedere seek
      // this._currentSongData = ytSong;

      
      /* 7. invio l'embed Now Playing e gestisco i reacts */
      const npMessage = await this.playingEmbed(playCmdMessage.channel)
      .catch(err => Promise.reject(err));
      this._nowPlayingMessage = npMessage;
      this.handleReacts();

      /* 8. elimino il messaggio trigger !play <> */
      playCmdMessage.deletable ? playCmdMessage.delete() : logDebug("Non ho eliminato il message del comando 'play'");

      // setBotActivity(playCmdMessage, `🎶 ${song.title}`);

      song.dispatcher.on('end', reason => {
        /* 9. Alla fine dello stream ________ */
        logDebug("Player 'end'" + reason ? ": " + reason : "");
        this._songs.shift();
        this.handleReacts(true);
        if (this._songs.length) this._songsSource.next(this._songs);
        // setBotActivity(playCmdMessage, "default");
        // this._currentSongData = null;
        // voiceChannel.leave();
      });

      return Promise.resolve();
    } catch (err) {
      if (userVoiceChannel.speakable) {
        song.dispatcher = null;
        // this._currentSongData = null;
        userVoiceChannel.leave();
      }
      // setBotActivity(playCmdMessage, "default");
      return new ErrorHandler(playCmdMessage).byString(err); // ?
    }
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
      return Promise.reject(err);
    }
  }

  playingEmbed = async (channel: TextChannel | DMChannel | GroupDMChannel): Promise<Message> => {
    const data = this.currentSong;
    if (!data) Promise.reject('no data in playingEmbed');
    const embedMsg = await channel.send(embed.nowPlaying(data, data.requestedBy));
    return Array.isArray(embedMsg) ? embedMsg[0] : embedMsg;
  }

  handleReacts = async (fromSelf: boolean = false): Promise<any> => {
    logDebug('entrato in handleReacts');

    const dispatcher = this.currentSong.dispatcher;
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
                if (!dispatcher) return;
                dispatcher.end('Stopped from reaction');
                npMsg.channel.send(embed.msg('⏹ ' + __("`{{songName}}` stopped by {{user}}",
                  { songName: this.currentSong.title, user: user.username })));
                // .then(() => this.resetCurrentSongData());
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

      if (dispatcher) {
        if (!dispatcher.paused) await npMsg.react('⏸');
        else await npMsg.react('▶');
        await npMsg.react('⏹');

      }
    } catch (err) {
      return Promise.reject(err);
    }

  }

}