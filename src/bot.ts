import { Client, Collection, Message } from 'discord.js';
import fs = require('fs');
import path = require('path');

import { SETTINGS } from '../config/settings.js';
import { ErrorHandler } from './errorhandler';
import { Command } from './models/command';
import { BotSettings } from './models/bot-settings';
import { logDebug, logError, logInfo, logVerbose, logWarn, setLogLevel } from './utils/logger';

/**
 * Main class of the Discord Bot.
 * @requires SETTINGS
 */
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

		this._getCommands();

		this._start();
	}

	private _getCommands() {
		const cmdPath = path.resolve(path.dirname(__dirname), './src/commands');
		logDebug(`cmdPath: ${cmdPath}`);

		// => Searching for commands
		const commandFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.ts'));
		logVerbose('commandFiles: ', commandFiles);
		let i = 1;
		for (const file of commandFiles) {
			const command = require(cmdPath + '\\' + file);
			this._client.commands.set(command.name, command);
			logVerbose(`[${i}/${commandFiles.length}] Command '${command.name}' loaded:`, command);
			i++;
		}
		logDebug(`List of commands: ${this._client.commands}`);
	}

	private _start(): void {

		// => Bot is ready...
		this._client.on('ready', () => {
			logInfo(`Connected!`);
			logInfo(`Logged in as ${this._client.user.tag}`);
			this._client.user.setActivity(this._config.activity);
		});

		/*****************************************************/
		// => Message handler
		this._client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.content.startsWith(this._config.prefix) && !message.author.bot) {
				this._handleCommand(message).then(cmd => logDebug(`Command ${cmd} executed successfully`))
					.catch(err => new ErrorHandler(message).byError(err));
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
			logVerbose(`Process exit.`);
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

		const args: any[] = message.content.slice(this._config.prefix.length).split(/ +/);
		const commandName = args.shift().toLowerCase();
		// logVerbose(`command: ${commandName}, args: `, args);

		if (this._client.commands.has(commandName)) {

			const command: Command = this._client.commands.get(commandName);
			if (command.args && !args.length) return Promise.reject({code: 'args_needed', command: command });

			try {
				command.client ? command.execute(message, this._client, args)
					: command.execute(message, undefined, args);
				return Promise.resolve(commandName);
			} catch (err) {
				logError(err);
				return Promise.reject("command_error");
			}
		} else return Promise.reject('no_command');
	}
}
