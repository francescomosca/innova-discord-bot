import { Message } from 'discord.js';
// import { Command } from './../models/command';
import { SETTINGS } from '../../config/settings.js';
import { Command } from '../models/command';
import { logDebug } from '../utils/logger';

const cmd: Command = {
  name: 'help',
  description: 'List all of the commands or info about a specific command.',
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
  const cmds = message.client.commands;
  const categories = Object.keys(Command.category);
  logDebug("command categories: " + categories.join(', '));

  // tslint:disable-next-line:prefer-const
  let data: string[] = [];

  data.push("Here's a list of all my commands:\n");
  data.push(cmds.map(cmd => cmd.name).join(', '));
  data.push(`\nYou can send \`${SETTINGS.prefix}help <command name>\` to get info on a specific command!`);

  return message.author.send(data, { split: true })
    .then(() => {
      if (message.channel.type === 'dm') return;
      message.reply("I\'ve sent you a DM with all my commands!").then(
        (msg: Message) => msg.deletable ? msg.delete(4000) : null
      );
    })
    .catch(error => {
      console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
      message.reply("it seems like I can't DM you! Do you have DMs disabled?");
    });
};

const showCommandDetails = async (message: Message, args: string[]) => {
  const cmds = message.client.commands;
  const name: string = args[0].toLowerCase();
  const command: Command = cmds.get(name) || cmds.find(cmd => cmd.aliases && cmd.aliases.includes(name));

  if (!command) {
    return message.reply("That's not a valid command!");
  }

  // tslint:disable-next-line:prefer-const
  let data: string[] = [];
  data.push(`**Name:** ${command.name}`);
  if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
  if (command.description) data.push(`**Description:** ${command.description}`);
  data.push(`**Category:** ${command.category}`);
  if (command.usage) data.push(`**Usage:** ${SETTINGS.prefix}${command.name} ${command.usage}`);

  message.channel.send(data, { split: true });
};

module.exports = cmd;