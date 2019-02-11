import { Message } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { logDebug } from '../utils/logger';
import { MusicService } from '../services/music-service';
import { embed } from '../utils/utils';

const cmd: Command = {
  name: 'add',
  // aliases: [],
  description: __("command.add.description:Add a song to the queue"),
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