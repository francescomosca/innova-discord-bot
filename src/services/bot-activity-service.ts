import { ActivityType, ClientUser } from 'discord.js';
// import { BehaviorSubject, Observable, of } from 'rxjs';

import { logDebug, logError } from '../utils/logger';
import { settings } from '../utils/utils';
import { MusicService } from './music-service';
import { Song } from "../models/song";
import { Subscription } from 'rxjs';

/** Gestisce automaticamente l'attività (testo inferiore al nome) del bot.
 * @requires MusicService.getInstance().currentSong$
 */
export class BotActivityService {
	private static _instance: BotActivityService;
	private _bot: ClientUser;

	// activitySource = new BehaviorSubject(new BotActivity());
	// activity$: Observable<BotActivity> = this.activitySource.asObservable();

	/** Singleton */
	private constructor(clientUser: ClientUser) {
		this._bot = clientUser;
		this.setBotActivity(); 
		// then...
		this._activityByMusic();
	}

	static getInstance(client: ClientUser) {
		if (!BotActivityService._instance) {
			BotActivityService._instance = new BotActivityService(client);
			logDebug('BotActivityService instance created');
		}
		return BotActivityService._instance;
	}

	private _activityByMusic(): Subscription {
		return MusicService.getInstance().songsChanged$.subscribe(
			(songs: Song[]) => { // o undefined
				logDebug(`currentSong sub songs[0]:\n"${songs[0]}"\nSetto la botActivity...`);
				this.setBotActivity(songs[0] ? songs[0].title : null);
			},
			err => logError('Errore nel sub di currentSong: ' + err)
		);
	}

	/* <any>new BotActivity(text, activity) */
	setBotActivity = async (text?: string, activity: ActivityType = 'LISTENING') => {
		if (!text) text = settings().defaultActivity;
		if (MusicService.getInstance().currentSong) text = "🎶 " + text;
		return this._bot.setActivity(text, { type : activity}).catch(Promise.reject);
	}


}