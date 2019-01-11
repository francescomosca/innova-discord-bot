import { Client, Message } from 'discord.js';

import { settings } from '../config/settings.js'; // noImplicitAny
import { BotSettings } from './model/settings';

import { logInfo, logWarn, logError , logVerbose, setLogLevel } from './utils/logger';

// DISCORD CLASS
export class DiscordBot {
	private _client: Client;
	private _config: BotSettings; // readonly solo se non effettuo modifiche real time

	constructor() {
		this._client = new Client();
		this._config = settings;

		setLogLevel(this._config.logLevel);
	}

	public start(): void {
		logInfo('Starting bot...');

		// => Bot is ready...
		this._client.on('ready', () => {
			logInfo(`[${this._config.botName}] Connected.`);
			logInfo(`Logged in as ${this._client.user.tag}`);
			this._client.user.setActivity(this._config.activity);
		});

		/*****************************************************/
		// => Message handler
		this._client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.author.id !== this._client.user.id) {
				// => Test command
				console.log('');
				if (message.content === this._config.prefix + 'ping') {
					message.reply('Pong !');
				}
			}
		});
		/*****************************************************/

		// => Bot error and warn handler
		this._client.on('error', logError);
		this._client.on('warn', logWarn);

		// => Process handler
		process.on('exit', () => {
			logVerbose(`[${this._config.botName}] Process exit.`);
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

		// => Login
		this._client.login(this._config.token)
		.then(() => {})
		.catch(logError);
	}
}
