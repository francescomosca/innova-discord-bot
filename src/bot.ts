import { Client, Collection, Message } from 'discord.js';
import { Spinner } from 'cli-spinner';
import fs = require('fs');
import path = require('path');

import { SETTINGS } from '../config/settings.js';
import { BotSettings } from './models/bot-settings';
import { ErrorHandler } from './errorhandler';
import { Command } from './models/command';
import { logDebug, logError, logInfo, logVerbose, logWarn, setLogLevel } from './utils/logger';

/**
 * Main class of the Discord Bot.
 * @requires SETTINGS
 */
export class DiscordBot {
	private _client: Client;
	private readonly _config: BotSettings; // readonly solo se non si effettuano modifiche real time
	private _loading: Spinner;

	constructor() {
		this._client = new Client();
		this._client.commands = new Collection();
		this._config = SETTINGS;
	}

	public init(): void {
		logInfo(`



		I N N O V A   B O T   v${process.env.npm_package_version}		
		
		
		`);

		logInfo('Starting bot...');

		setLogLevel(this._config.logLevel);

		this._getCommands();

		this._start();
	}

	private _getCommands() {
		// find the commands path relative to the OS
		const cmdPath = path.resolve(path.dirname(__dirname), './src/commands');
		logDebug(`cmdPath: ${cmdPath}`);

		// => Searching for commands
		const commandFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.ts'));
		logVerbose('commandFiles: ' + commandFiles);
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
			this._loading.stop(true);
			logInfo(`Connected!`);
			logInfo(`Logged in as ${this._client.user.tag}`);

			// sets the text under the bot's name
			this._client.user.setActivity(this._config.activity);
		});

		/*****************************************************/
		// => Message listener
		this._client.on('message', (message: Message) => {
			// => Prevent message from the bot
			if (message.content.startsWith(this._config.prefix) && !message.author.bot) {
				this._handleCommand(message)
					.then(cmd => logDebug(`Command ${cmd} executed successfully`)
						.catch(err => new ErrorHandler(message).byError(err)))
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
		this._client.on('error', err => {
			this._loading.stop(true);
			logError(err.stack);
		});
		this._client.on('warn', err => {
			this._loading.stop(true);
			logWarn(err);
		});

		// => Process handler
		process.on('exit', () => {
			this._loading.stop(true);
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

		this._loading = new Spinner('Connecting..');
		this._loading.start();

		// => Login
		this._client.login(this._config.token)
			.then(_token => { })
			.catch(logError);
	}

	private _handleCommand(message: Message): Promise<any> {
		logDebug(`Triggered from the message: "${message.content}" by ${message.author}`);

		// copy/point to the commands list
		const cmds = this._client.commands;
		// subtract the command and the args
		const args: string[] = message.content.slice(this._config.prefix.length).split(/ +/);
		const commandName: string = args.shift().toLowerCase();

		// check if the command exist
		const command: Command = cmds.get(commandName) || cmds.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
		if (!command) return Promise.reject('no_command');

		// if the command need args, throw 'args_needed'
		if (command.args && !args.length) return Promise.reject({ code: 'args_needed', command: command });

		try {
			// if the commands needs the client as an argument
			command.client ? command.execute(message, this._client, args)
				: command.execute(message, undefined, args);
			return Promise.resolve(commandName); // @todo fixare perchè va sempre in positivo
		} catch (err) {
			logError(err);
			return Promise.reject("command_error");
		}

	}
}
