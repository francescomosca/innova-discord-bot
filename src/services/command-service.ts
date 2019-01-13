import { Collection, Message } from 'discord.js';
import { logDebug, logVerbose, logError } from "../utils/logger";
import fs = require('fs');
import path = require('path');
import { Command } from "../models/command";
import { cmdUtils } from '../utils/cmd-utils';

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

  getCommands = () => {
		// find the commands path relative to the OS
		const cmdPath = path.resolve(path.dirname(__dirname), './commands');
		logDebug(`cmdPath: ${cmdPath}`);

		// => Searching for commands
		const cmdFiles = fs.readdirSync(cmdPath).filter(file => file.endsWith('.ts'));
		logVerbose('commandFiles: ' + cmdFiles);
		let count = 1;
		for (const file of cmdFiles) {
			const cmdFile: Command = require(path.resolve(cmdPath + '/' + file));
			// console.log(`[${count}/${cmdFiles.length}] cmdFile: `, cmdFile);
			this._commands.set(cmdFile.name, cmdFile);
			logVerbose(`[${count}/${cmdFiles.length}] Command '${cmdFile.name}' loaded`, cmdFile);
			count++;
		}
		logDebug(`List of commands: ${this._commands}`);
  }

  public async handleCommand(message: Message): Promise<any> {
		logDebug(`Triggered from the message: "${message.content}" by ${message.author}`);

		// subtract the command and the args
		const args: string[] = cmdUtils.command.getArgs(message);
		const commandName: string = args.shift().toLowerCase();

		// check if the command exist
		return cmdUtils.command.exists(commandName, this.commands)
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