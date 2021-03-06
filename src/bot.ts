import { setBotAvatar } from './utils/utils';
import { Spinner } from 'cli-spinner';
import { Client, Message } from 'discord.js';
import { __ } from 'i18n';

import { ErrorHandler } from './errorhandler';
import { BotSettings } from './models/bot-settings';
import { CommandService } from './services/command-service';
import { setBotActivity } from './utils/bot-activity';
import { logError, logInfo, logVerbose, logWarn, setLogLevel } from './utils/logger';

/**
 * Main class of the Discord Bot.
 */
export class DiscordBot {
	private _client: Client;
	private _loading: Spinner;

	private _commandServ: CommandService = CommandService.getInstance();
	constructor(private readonly _config: BotSettings) {  // readonly solo se non si effettuano modifiche real time
		this._client = new Client();

		console.clear();
		logInfo(`



		I N N O V A   B O T   v${process.env.npm_package_version}		
		
		
		`);
		setLogLevel(this._config.logLevel);
		logInfo(__('Starting bot...'));
		this._commandServ.getCommands();
		this._start();
	}

	private _start(): void {

		/* => Bot is ready...*/
		this._client.on('ready', () => {
			this._loading.stop(true);
			logInfo(__("Connected!"));
			logInfo(__(`Logged in as %s`, this._client.user.tag));

			// save the bot's avatar for using it in embeds
			setBotAvatar(this._client.user.avatarURL);
			// sets the text under the bot's name
			setBotActivity(this._client.user);
		});

		/* => Message listener */
		this._client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.content.startsWith(this._config.prefix) && !message.author.bot) {
				this._commandServ.handleCommand(message)
					.then(_cmd => { }
						, thenErr => new ErrorHandler(message).byError(thenErr, thenErr.command ? thenErr.command : undefined))
					.catch(err => { new ErrorHandler(message).byError(err.message, err.command ? err.command : undefined); });
			} /* else {
					if (message.content.toLowerCase().includes('ciao bot')) {
						message.reply(__('Hi human!'));
				}
			} */
		});

		/* => Bot error and warn handler */
		this._client.on('error', err => {
			this._loading.stop();
			console.error(err);
			logError(err.stack);
		});
		this._client.on('warn', err => {
			this._loading.stop();
			console.warn(err);
			logWarn(err);
		});

		/* => Process handler */
		process.on('exit', () => {
			this._loading.stop(true);
			logVerbose(`Process exit.`);
			// @todo uscire dal canale vocale prima della chiusura
			this._client.destroy();
		});
		process.on('uncaughtException', (err: Error) => {
			const errorMsg = (err ? err.stack || err : '').toString()
				.replace(new RegExp(`${__dirname}\/`, 'g'), './');
			logError(errorMsg);
		});
		process.on('unhandledRejection', (err: Error) => {
			logError('Uncaught Promise error: \n' + err.stack);
		});

		this._loading = new Spinner({
			text: __('Connecting...'),
			// stream: process.stderr
		});
		this._loading.setSpinnerString(9);
		this._loading.start();

		/* => Login */
		this._client.login(this._config.token).then(_token => this._loading.stop(true))
			.catch(err => {
				this._loading.stop();
				logError(err);
			});

		this._client.on('disconnect', () => logWarn(__('I just disconnected. I\'ll try to reconnect now...')));
		this._client.on('reconnecting', () => {
			this._loading.start().setSpinnerTitle(__('Reconnecting...'));
		});
	}

}
