import { Collection, ColorResolvable, Message, RichEmbed } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { ConfigService } from '../services/config-service';
import { BotSettings } from './../models/bot-settings';
import { YtQuery } from './../models/yt-query';
import { logVerbose } from './logger';
import { E } from '../models/errors';

export const stringCapitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * @return BotSettings 
 * @alias ConfigService.getInstance().settings; 
 * */
export const settings = (): BotSettings => ConfigService.getInstance().settings;

export const cmdUtils = {
  command: {

    /** Checks if the command exist. */
    exists: (cmdName: string, cmdList: Collection<string, Command>): Command => {
      const command: Command = cmdList.get(cmdName) || cmdList.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));
      return command ? command : null;
    },

    /** Throws 'args_needed' if the command need args. */
    checkArgsNeeded: (command: Command, args: string[]): Promise<any> => {
      logVerbose(`[checkArgs] command.name: ${command.name}` + (args.length ? `| args: ${args.join(', ')}` : ""));
      const argsNeeded = command.args && !args.length;
      return argsNeeded ? Promise.reject({errCode: E.ArgsNeeded, command: command}) : Promise.resolve();
    },

    /** Get the arguments from the message. */
    getArgs: (fromMessage: Message): string[] => {
      return fromMessage.content.slice(settings().prefix.length).split(/ +/);
      // logVerbose('getArgs data: ' + args.join(', '));
    }

  },
  user: {
    /** Checks if the command needs a permission and the user has that permission. */
    hasPermission: (command: Command, message: Message): boolean => {
      if (command.category != "admin") return true;
      return (command.category == "admin" && message.member.hasPermission('ADMINISTRATOR'));
    }

  }
};

export const embed = {
  msg: (title: string, withFooter: boolean = true): { embed: RichEmbed } => {
    const embed = new RichEmbed()
    .setTitle(title);

    if (withFooter) embed
      .setFooter(settings().botName + ' v' + process.env.npm_package_version)
      .setTimestamp(new Date());
    return { embed: embed };
  },
  nowPlaying: (data: YtQuery, requestedBy: string): { embed: RichEmbed } => {
    return {
      embed: new RichEmbed()
        .setColor(<ColorResolvable>27808)
        // .setAuthor(message.client.user.username, message.client.user.avatarURL)
        .setTitle(`🎶 ${__("Now Playing")} `)
        .setDescription(`[${data.title}](${data.url})\n${__("Requested by:")} <@${requestedBy}>`)
        .setThumbnail(data.thumbnails.default.url)
        .setTimestamp(new Date())
        .setFooter(settings().botName + ' v' + process.env.npm_package_version)
    };
  },
  help: (cmds: Collection<any, any>, message: Message): { embed: RichEmbed } => {
    // tslint:disable-next-line:prefer-const
    let finalEmbed: RichEmbed = new RichEmbed()
      .setColor(3447003)
      // .setAuthor(message.client.user.username, message.client.user.avatarURL)
      .setTitle(__("command.help.embed.title:Here's a list of all my commands"))
      .setDescription(__("command.help.embed.description:You can send `%shelp <command name>` to get info on a specific command.", settings().prefix))
      .setTimestamp(new Date())
      .setFooter("InnovaBot " + process.env.npm_package_version, message.client.user.avatarURL);

    let catCommands: Command[] = [];
    for (const cat in Command.category) {
      if (cat) {
        // cerca i comandi della categoria selezionata
        catCommands = cmds.filterArray(cmd => cmd.category == cat);
        // logVerbose(`cat: ${cat} | commands: ${catCommands.map(x => x.name).join(', ')}`);
        if (catCommands.map(cmd => cmd).length) finalEmbed.addField(
          stringCapitalize(cat),
          catCommands.map(cmd => `\`${settings().prefix + cmd.name}\` - *${cmd.description}*`).join('\n')
        );
      }
    }
    return { embed: finalEmbed };
  }

};