import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { logDebug } from '../utils/logger';
import { __ } from 'i18n';
import { embed } from '../utils/utils';

const cmd: Command = {
  name: 'play',
  aliases: ['stream', 'search'],
  description: __("command.play.description"),
  category: 'music',
  args: true,
  usage: '<youtube url | query string>',
  async execute(message: Message, args: string[]): Promise<any> {
    const cleanQuery = args.join(' ');
    logDebug('play args: ' + cleanQuery);

    if (!message.guild) return;

    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply(embed.msg(__('Please join a voice channel first!')));

    const musicServ = MusicService.getInstance();
    return musicServ.addSongs(cleanQuery, voiceChannel, message)
      .catch(err => Promise.reject(err));
  },
};

module.exports = cmd;