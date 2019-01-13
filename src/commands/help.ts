import { CommandService } from './../services/command-service';
import { Message, Collection, RichEmbed } from 'discord.js';
// import { Command } from './../models/command';
import { SETTINGS } from '../../config/settings.js';
import { Command } from '../models/command';
import { logDebug, logError } from '../utils/logger';
import { stringCapitalize } from '../utils/utils';
import { __ } from 'i18n';

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

  const helpMsg: RichEmbed = getCmdsEmbed(cmds, message);

  if (SETTINGS.helpInDm) {
    return message.author.send({ embed: helpMsg })
    .then(() => {
      if (message.channel.type === 'dm') return;
      message.reply(__("command.help.dmSent:I've sent you a DM with all my commands!")).then(
        (msg: Message) => msg.deletable ? msg.delete(4000) : null
      );
    })
    .catch(error => {
      logError(`Could not send help DM to ${message.author.tag}.\n` + error);
      console.error(error);
      message.reply(__("command.help.dmError:it seems like I can't DM you! Do you have DMs disabled?"));
    });
  } else {
    return message.channel.send({ embed: helpMsg })
    .then(() => { })
    .catch(error => {
      logError(`Could not send help to ${message.author.tag}.\n` + error);
      console.error(error);
    });
  }
};

const getCmdsEmbed = (cmds: Collection<any, any>, message: Message): RichEmbed => {
  // tslint:disable-next-line:prefer-const
  let finalEmbed: RichEmbed = new RichEmbed()
    .setColor(3447003)
    .setAuthor(message.client.user.username, message.client.user.avatarURL)
    .setTitle(__("command.help.embed.title:Here's a list of all my commands"))
    .setDescription(__("command.help.embed.description:You can send `%shelp <command name>` to get info on a specific command.", SETTINGS.prefix))
    .setTimestamp(new Date())
    .setFooter("InnovaBot " + process.env.npm_package_version, message.client.user.avatarURL);

  let catCommands: Command[] = [];
  for (const cat in Command.category) {
    if (cat) {
      catCommands = cmds.filterArray(cmd => cmd.category == cat);
      // logVerbose(`cat: ${cat} | catCommands: ${catCommands.map(x => x.name).join(', ')}`);
      if (catCommands.map(cmd => cmd).length) finalEmbed.addField(
        stringCapitalize(cat),
        catCommands.map(cmd => `\`${SETTINGS.prefix + cmd.name}\` - *${cmd.description}*`).join('\n')
      );

    }
  }
  return finalEmbed;
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
  if (command.usage) data.push(`**${__('Usage')}:** ${SETTINGS.prefix}${command.name} ${command.usage}`);

  message.channel.send(data, { split: true });
};

module.exports = cmd;