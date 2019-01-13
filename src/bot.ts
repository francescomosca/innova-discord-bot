import { Client, Collection, Message } from 'discord.js';
import { Spinner } from 'cli-spinner';
import fs = require('fs');
import path = require('path');

import { SETTINGS } from '../config/settings.js';
import { BotSettings } from './models/bot-settings';
import { ErrorHandler } from './errorhandler';
import { Command } from './models/command';
import { logDebug, logError, logInfo, logVerbose, logWarn, setLogLevel } from './utils/logger';
import { cmdUtils } from './utils/cmd-utils';

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
		this._client.commands = new Collection(); // public commands: Collection<string, Command>;
		this._config = SETTINGS;
	}

	public init(): void {
		console.clear();
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
		const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.ts'));
		logVerbose('commandFiles: ' + cmdFiles);
		let count = 1;
		for (const file of cmdFiles) {
			const cmdFile: Command = require(path.resolve(cmdPath + '/' + file));
			// console.log(`[${count}/${cmdFiles.length}] cmdFile: `, cmdFile);
			this._client.commands.set(cmdFile.name, cmdFile);
			logVerbose(`[${count}/${cmdFiles.length}] Command '${cmdFile.name}' loaded`, cmdFile);
			count++;
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
					.then(cmd => {})
					.catch(err => new ErrorHandler(message).byError(err));
			} /* else {
					if (message.content.toLowerCase().includes('ciao bot')) {
						message.reply('Ciao umano!');
				}
			} */
		});
		/*****************************************************/

		// => Bot error and warn handler
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

		// => Process handler
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

		this._loading = new Spinner('Connecting..');
		this._loading.start();

		// => Login
		this._client.login(this._config.token)
			.then(_token => { })
			.catch(logError);
	}

	private async _handleCommand(message: Message): Promise<any> {
		logDebug(`Triggered from the message: "${message.content}" by ${message.author}`);

		// subtract the command and the args
		const args: string[] = cmdUtils.command.getArgs(message);
		const commandName: string = args.shift().toLowerCase();

		// check if the command exist
		return cmdUtils.command.exists(commandName, this._client.commands)
			.then(async (cmd: Command) => {
				await cmdUtils.command.checkArgsNeeded(cmd, args);
				await cmdUtils.user.hasPermission(cmd, message);

				try {
					await cmd.execute(message, args);
					return Promise.resolve(cmd);
				} catch (err) {
					logError(err);
					return Promise.reject("command_error");
				}

			}).catch(err => Promise.reject(err));
	}
}
