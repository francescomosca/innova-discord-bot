import { Message } from 'discord.js';
// import { Command } from './../models/command';
import { SETTINGS } from '../../config/settings.js';
import { Command } from '../models/command.js';

module.exports = {
  name: 'help',
  description: 'List all of the commands or info about a specific command.',
  aliases: ['commands', 'info'],
  args: false,
  client: true,
  execute(message: Message, args?: string[]) {
    const cmds = message.client.commands;

    if (!args.length) {
      // show commands list
      showCommandList(message, cmds);
    } else {
      // show command details

      const name: string = args[0].toLowerCase();
      const command: Command = cmds.get(name) || cmds.find(c => c.aliases && c.aliases.includes(name));

      if (!command) {
        return message.reply("That's not a valid command!");
      }

      // tslint:disable-next-line:prefer-const
      let data: string[] = [];
      data.push(`**Name:** ${command.name}`);
      if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
      if (command.description) data.push(`**Description:** ${command.description}`);
      if (command.usage) data.push(`**Usage:** ${SETTINGS.prefix}${command.name} ${command.usage}`);

      message.channel.send(data, { split: true });
    }
  },
};

const showCommandList = async (message: Message, cmds) => {
  // tslint:disable-next-line:prefer-const
  let data: string[] = [];

  data.push("Here's a list of all my commands:\n");
  data.push(cmds.map(cmd => SETTINGS.prefix + cmd.name).join(', '));
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
      message.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
    });
};