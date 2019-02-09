import { CommandService } from './../services/command-service';
import { Message, Collection } from 'discord.js';
import { Command } from '../models/command';
import { logDebug, logError } from '../utils/logger';
import { settings, embed } from '../utils/utils';
import { __ } from 'i18n';
import { ErrorHandler } from '../errorhandler';
import { E } from '../models/errors';

const cmd: Command = {
  name: 'help',
  description: __("command.help.description"),
  category: 'general',
  aliases: ['commands', 'info'],
  args: false,
  async execute(message: Message, args?: string[]) {

    if (!args.length) {
      // show commands list
      showCommandList(message);
    } else {
      // show command details
      showCommandDetails(message, args);
    }
  }
};

const showCommandList = async (message: Message) => {
  const cmds = CommandService.getInstance().commands;
  const categories = Object.keys(Command.category);
  logDebug("command categories: " + categories.join(', '));

  const helpEmbed = embed.help(cmds, message);

  if (settings().helpInDm) {
    return message.author.send(helpEmbed)
    .then(() => {
      if (message.channel.type === 'dm') return;
      message.reply(__("command.help.dmSent:I've sent you a DM with all my commands!")).then(
        (msg: Message) => msg.deletable ? msg.delete(4000) : null
      );
    })
    .catch(error => {

      new ErrorHandler(message).byError({ errCode: E.CantDm, errMessage: error}, message.author.tag);
    });
  } else {
    return message.channel.send(helpEmbed)
    .then(() => { })
    .catch(error => {
      logError(`Could not send help to ${message.author.tag}.\n` + error);
      console.error(error);
    });
  }
};

const showCommandDetails = async (message: Message, args: string[]) => {
  const cmds: Collection<any, any> = CommandService.getInstance().commands;
  const name: string = args[0].toLowerCase();
  const command: Command = cmds.get(name) || cmds.find(cmd => cmd.aliases && cmd.aliases.includes(name));

  if (!command) {
    return message.reply(__("That's not a valid command"));
  }

  // tslint:disable-next-line:prefer-const
  let data: string[] = [];
  data.push(`**${__('Name')}:** ${command.name}`);
  if (command.aliases) data.push(`**${__('Aliases')}:** ${command.aliases.join(', ')}`);
  if (command.description) data.push(`**${__('Description')}:** ${command.description}`);
  data.push(`**${__('Category')}:** ${command.category}`);
  if (command.usage) data.push(`**${__('Usage')}:** ${settings().prefix}${command.name} ${command.usage}`);

  message.channel.send(data, { split: true });
};

module.exports = cmd;