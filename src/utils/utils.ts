import { Collection, ColorResolvable, Message, RichEmbed } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { E } from '../models/errors';
import { ConfigService } from '../services/config-service';
import { BotSettings } from './../models/bot-settings';
import { logVerbose } from './logger';
import { Song } from "../models/song";


let botAvatar = "";
export const setBotAvatar = (avatar: string) => botAvatar = avatar;

export const stringCapitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * @requires ConfigService
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
      logVerbose(`[checkArgs] command.name: ${command.name}` + (args.length ? ` | args: ${args.join(', ')}` : ""));
      const argsNeeded = command.args && !args.length;
      return argsNeeded ? Promise.reject({ errCode: E.ArgsNeeded, command: command }) : Promise.resolve();
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

/**
 * Transform a string in emojis.
 * @param  {string} text The original text
 * @returns string
 * @example
 * textToEmoji('abc')
 * // returns
 * `:regional_indicator_a::regional_indicator_b::regional_indicator_c:`
 */
const textToEmoji = (text: string): string => {
  return text.split('').map(
    char => char.match(/[a-z]/i) ? `:regional_indicator_${char.toLowerCase()}:` : char.toUpperCase()
  ).join('');

};

/** A collection of embeds. */
export const embed = {
  _defaultFooter: settings().botName + ' v' + process.env.npm_package_version,
  msg: (title: string | number, withFooter: boolean = true): { embed: RichEmbed } => {
    const finalEmbed = new RichEmbed().setTitle(title);
    if (withFooter) finalEmbed
      .setFooter(embed._defaultFooter, botAvatar);
    // .setTimestamp(new Date());
    return { embed: finalEmbed };
  },
  ping: (apiLatency: number, latency: number): { embed: RichEmbed } => {
    return {
      embed: new RichEmbed()
        .setTitle(textToEmoji('pong'))
        .addField('API latency', apiLatency + "ms", true)
        .addField('Total latency', latency + "ms", true)
        .setFooter(embed._defaultFooter, botAvatar)
        // .setTimestamp(new Date())
    };
  },
  nowPlaying: (data: Song): { embed: RichEmbed } => {
    return {
      embed: new RichEmbed()
        .setColor(<ColorResolvable>27808)
        // .setAuthor(message.client.user.username, message.client.user.avatarURL)
        .setTitle(`🎶 ${__("Now Playing")} `)
        .setDescription(`[${data.title}](${data.url})\n${__("Requested by:")} <@${data.requestedBy}>`)
        .setThumbnail(data.thumbnailUrl)
        .setTimestamp(new Date())
        .setFooter(embed._defaultFooter, botAvatar)
    };
  },
  help: (cmds: Collection<any, any>): { embed: RichEmbed } => {
    // tslint:disable-next-line:prefer-const
    let finalEmbed: RichEmbed = new RichEmbed()
      .setColor(3447003)
      // .setAuthor(message.client.user.username, message.client.user.avatarURL)
      .setTitle(__("command.help.embed.title:Here's a list of all my commands"))
      .setDescription(__("command.help.embed.description:You can send `%shelp <command name>` to get info on a specific command.", settings().prefix))
      .setTimestamp(new Date())
      .setFooter(embed._defaultFooter, botAvatar);

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
  },
  queue: (songList: string): { embed: RichEmbed } => {
    return {
      embed: new RichEmbed()
        .setColor(<ColorResolvable>27808)
        // .setAuthor(message.client.user.username, message.client.user.avatarURL)
        .setTitle(`🎶 ${__("Song list")} `)
        .setDescription(songList)
        
        .setTimestamp(new Date())
        .setFooter(embed._defaultFooter, botAvatar)
    };
  }

};