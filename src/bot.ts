import { Client, Collection, Message } from 'discord.js';
import fs = require('fs');

import { SETTINGS } from '../config/settings.js';
import { ErrorHandler } from './errorhandler';
import { BotSettings } from './models/settings';
import { logDebug, logError, logInfo, logVerbose, logWarn, setLogLevel } from './utils/logger';

// DISCORD CLASS
export class DiscordBot {
	private _client: Client;
	private readonly _config: BotSettings; // readonly solo se non si effettuano modifiche real time

	constructor() {
		this._client = new Client();
		this._client.commands = new Collection();
		this._config = SETTINGS;
	}

	public init(): void {
		setLogLevel(this._config.logLevel);
		logInfo(`

	I N N O V A   B O T   v${process.env.npm_package_version}
		
	`);
		logInfo('Starting bot...');

		// => Searching for commands
		const commandFiles = fs.readdirSync(__dirname + '/commands').filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			this._client.commands.set(command.name, command);
		}
		logVerbose(`Commands loaded: ${this._client.commands}`);

		this._start();
	}

	private _start(): void {

		// => Bot is ready...
		this._client.on('ready', () => {
			logInfo(`[${this._config.botName}] Connected!`);
			logInfo(`Logged in as ${this._client.user.tag}`);
			this._client.user.setActivity(this._config.activity);
		});

		/*****************************************************/
		// => Message handler
		this._client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.content.startsWith(this._config.prefix) && !message.author.bot) {
				this._handleCommand(message).then(cmd => logDebug(`Command ${cmd} executed successfully`))
					.catch(err => new ErrorHandler(message).byErrorString(err));
			} else {
				/*
					if (message.content.toLowerCase().includes('ciao bot')) {
						message.reply('Ciao umano!');
				}*/
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
			.then(_token => { })
			.catch(logError);
	}

	private _handleCommand(message: Message): Promise<any> {
		logDebug(`Triggered from the message: "${message.content}" by ${message.author}`);

		const args = message.content.slice(this._config.prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();
		logVerbose(`command: ${commandName}, args: `, args);

		if (this._client.commands.has(commandName)) {

			const command = this._client.commands.get(commandName);
			if (command.args && !args.length) return Promise.reject('args_needed');

			try {
				command.client ? command.execute(message, args, this._client)
					: command.execute(message, args);
				return Promise.resolve(commandName);
			} catch (err) {
				logError(err);
				return Promise.reject("command_error");
			}
		} else return Promise.reject('no_command');
	}
}
