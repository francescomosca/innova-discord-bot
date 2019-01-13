import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { logDebug } from '../utils/logger';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'play',
  description: 'Streams a song inside a guild\'s channel.',
  category: 'music',
  args: true,
  usage: '<youtube url | query string>',
  async execute(message: Message, args: string[]): Promise<any> {
    const cleanArg = args.join(' ');
    logDebug('play args: ' + cleanArg);
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    const voiceChannel = message.member.voiceChannel;

    if (!voiceChannel) return message.reply('please join a voice channel first!');

    return MusicService.getInstance().playFromYoutube(cleanArg, voiceChannel, message)
      .catch(err => Promise.reject(err));
  },
};

module.exports = cmd;