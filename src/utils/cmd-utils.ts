import { Message, Collection } from 'discord.js';
import { Command } from '../models/command';
import { SETTINGS } from '../../config/settings.js';
import { logVerbose, logWarn } from './logger';

export const cmdUtils = {
  command: {
    /** Get the arguments from the message */
    getArgs: (fromMessage: Message): string[] => {
      const args = fromMessage.content.slice(SETTINGS.prefix.length).split(/ +/);
      // logVerbose('getArgs data: ' + args.join(', '));
      return args;
    },
    /** Check if the command exist */
    exists: async (cmdName: string, cmdList: Collection<string, Command>): Promise<Command> => {
      const command = cmdList.get(cmdName) || cmdList.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
      return command ? Promise.resolve(command) : Promise.reject('no_command');
    },
    /** Throws 'args_needed' if the command need args */
    checkArgsNeeded: (command: Command, args: string[]): Promise<any> => {
      logVerbose(`[checkArgs] command.name: ${command.name} | args: ${args.join(', ')}`);
      const argsNeeded = command.args && !args.length;
      return argsNeeded ? Promise.reject({ errCode: 'args_needed', command: command }) : Promise.resolve();
    },
  },
  user: {
    hasPermission: (command: Command, message: Message): Promise<any> => {
      if (command.category != "admin") return Promise.resolve();
      else if (command.category == "admin" && message.member.hasPermission('ADMINISTRATOR')) {
        Promise.resolve();
      } else Promise.reject('no_permission');
    },
  }
};