import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { __ } from 'i18n';

const cmd: Command = {
  enabled: false,
  name: 'np',
  description: __("command.np.description"),
  category: 'music',
  aliases: ['nowplaying', 'song'],
  args: false,
  async execute(message: Message, _args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    const musicService = MusicService.getInstance();
    if (musicService.currentSong.dispatcher) {
      musicService.playingEmbed(message);
    } else return message.channel.send('There is no song playing...');
  },
};

module.exports = cmd;