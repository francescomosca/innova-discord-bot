import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';

const cmd: Command = {
  name: 'np',
  description: 'Show what song is currently playing.',
  category: 'music',
  aliases: ['nowplaying', 'song'],
  args: false,
  async execute(message: Message, args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    const musicService = MusicService.getInstance();
    if (musicService.player) {
      musicService.playingEmbed(message);
    } else return message.channel.send('There is no song playing...');
  },
};

module.exports = cmd;