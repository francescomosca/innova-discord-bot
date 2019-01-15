import { Message, Collection } from 'discord.js';
import { Command } from '../models/command';
import { logVerbose } from './logger';
import { settings } from './utils';

export const cmdUtils = {
  command: {
    /** Get the arguments from the message. */
    getArgs: (fromMessage: Message): string[] => {
      const args = fromMessage.content.slice(settings().prefix.length).split(/ +/);
      // logVerbose('getArgs data: ' + args.join(', '));
      return args;
    },
    /** Checks if the command exist. */
    exists: async (cmdName: string, cmdList: Collection<string, Command>): Promise<Command> => {
      const command: Command = cmdList.get(cmdName) || cmdList.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
      return command ? Promise.resolve(command) : Promise.reject('no_command');
    },
    /** Throws 'args_needed' if the command need args. */
    checkArgsNeeded: (command: Command, args: string[]): Promise<any> => {
      logVerbose(`[checkArgs] command.name: ${command.name} | args: ${args.join(', ')}`);
      const argsNeeded = command.args && !args.length;
      return argsNeeded ? Promise.reject({ errCode: 'args_needed', command: command }) : Promise.resolve();
    },
    enabled: (command: Command): Promise<any> => {
      return command.enabled ? Promise.resolve() : Promise.reject('command_disabled');
    }
  },
  user: {
    /** Checks if the command needs a permission and the user has that permission. */
    hasPermission: (command: Command, message: Message): Promise<any> => {
      if (command.category != "admin") return Promise.resolve();
      else if (command.category == "admin" && message.member.hasPermission('ADMINISTRATOR')) {
        Promise.resolve();
      } else Promise.reject('no_permission');
    },
  }
};