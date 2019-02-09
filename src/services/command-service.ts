import { Collection, Message } from 'discord.js';
import { readdirSync } from 'fs';
import { __ } from 'i18n';
import { dirname, resolve } from 'path';

import { Command } from '../models/command';
import { logDebug, logError, logVerbose } from '../utils/logger';
import { cmdUtils } from '../utils/utils';
import { E } from '../models/errors';

export class CommandService {
	private static _instance: CommandService;

	private _commands = new Collection<string, Command>();

	private constructor() { }

	/** Singleton */
	static getInstance() {
		if (!CommandService._instance) {
			logDebug('CommandService instance created');
			CommandService._instance = new CommandService();
		}
		return CommandService._instance;
	}

	get commands() {
		return this._commands;
	}

	private _cmdFactory(cmdFile: object): Command {
		const cmdTpl = new Command();
		return { ...cmdTpl, ...cmdFile }; // come Object.assign ma col ritorno giusto
	}

	getCommands = () => {
		// find the commands path relative to the OS
		const cmdPath = resolve(dirname(__dirname), './commands');
		logDebug(`cmdPath: ${cmdPath}`);

		// => Searching for commands
		const cmdFiles = readdirSync(cmdPath).filter(file => file.endsWith('.ts'));
		logVerbose('commandFiles: ' + cmdFiles);
		let count = 1;
		for (const file of cmdFiles) {
			const cmdFile: Command = require(resolve(cmdPath + '/' + file));
			// console.log(`[${count}/${cmdFiles.length}] cmdFile: `, cmdFile);
			this._commands.set(cmdFile.name, this._cmdFactory(cmdFile));
			logVerbose(`[${count}/${cmdFiles.length}] ${__("Command '%s' loaded", cmdFile.name)}`, cmdFile);
			count++;
		}
		// logDebug(`${__("Command's list")}: ${this._commands}`);
	}

	public async handleCommand(cmdMessage: Message): Promise<any> {
		logDebug(`[${__("Triggered")}] ${cmdMessage.author.tag}: '${cmdMessage.content}'`);

		// subtract the command and the args
		const args: string[] = cmdUtils.command.getArgs(cmdMessage);
		const commandName: string = args.shift().toLowerCase();

		// checks
		const cmd: Command = cmdUtils.command.exists(commandName, this.commands);
		if (!cmd || cmd == null) return Promise.reject('no_command');
		if (!cmd.enabled) return Promise.reject('command_disabled');
		if (!cmdUtils.user.hasPermission(cmd, cmdMessage)) return Promise.reject('no_permission');
		await cmdUtils.command.checkArgsNeeded(cmd, args);

		try {
			await cmd.execute(cmdMessage, args);
			return Promise.resolve(cmd);
		} catch (err) {
			logError(err);
			return Promise.reject({ errCode: E.CommandError, errMessage: err });
		}
	}
}