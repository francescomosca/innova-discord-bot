import { ActivityType, ClientUser } from 'discord.js';
// import { BehaviorSubject, Observable, of } from 'rxjs';

import { logDebug, logError } from '../utils/logger';
import { settings } from '../utils/utils';
import { MusicService, Song } from './music-service';
import { Subscription } from 'rxjs';

export class BotActivity {
	name: string = settings().defaultActivity;
	options = { activity: <ActivityType>"LISTENING" };

	constructor(text?: string, activity?: ActivityType) {
		logDebug('new BotActivity()');
		if (text) {
			if (MusicService.getInstance().currentSong) text = "🎶 " + text;
			this.name = text;
		}
		if (activity) this.options.activity = activity;
	}
}

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
		this._musicSub();
	}

	static getInstance(client: ClientUser) {
		if (!BotActivityService._instance) {
			BotActivityService._instance = new BotActivityService(client);
			logDebug('BotActivityService instance created');
		}
		return BotActivityService._instance;
	}

	private _musicSub(): Subscription {
		return MusicService.getInstance().songs$.subscribe(
			(songs: Song[]) => { // o undefined
				logDebug(`currentSong sub songs[0]:\n"${songs[0]}"\nSetto la botActivity...`);
				this.setBotActivity(songs[0].title);
			},
			err => logError('Errore nel sub di currentSong: ' + err)
		);
	}

	setBotActivity = (text?: string, activity?: ActivityType) =>
		this._bot.setActivity(<any>new BotActivity(text, activity)) // @todo testare quell'<any>


}