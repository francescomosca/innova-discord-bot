import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { __ } from 'i18n';

const cmd: Command = {
  name: 'stop',
  description: __("command.stop.description"),
  category: 'music',
  args: false,
  async execute(message: Message, args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    // const voiceChannel = message.member.voiceChannel;
    // if (!voiceChannel) return message.reply('please join a voice channel first!');
    const musicService = MusicService.getInstance();
    if (musicService.player) {
      musicService.player.end('Stopped from command');
      return message.channel.send(`⏹ Song \`${musicService.currentSongData.title}\` stopped.`)
        .then(() => musicService.resetCurrentSongData());
    } else return message.channel.send('There is no music to stop...');
  },
};

module.exports = cmd;