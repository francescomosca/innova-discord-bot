import { Message } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { MusicService } from '../services/music-service';

const cmd: Command = {
  name: 'stop',
  description: __("command.stop.description"),
  category: 'music',
  args: false,
  async execute(message: Message, _args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    // const voiceChannel = message.member.voiceChannel;
    // if (!voiceChannel) return message.reply('please join a voice channel first!');
    const musicService = MusicService.getInstance();
    if (musicService.player) {
      musicService.player.end('Stopped from command');
      return message.channel.send(
        '⏹ ' + __("Song `{{songName}}` stopped by {{user}}",
          { songName: '`' + musicService.currentSongData.title + '`', user: message.author.username }))
        .then(() => musicService.resetCurrentSongData());
    } else return message.channel.send(__('There is no music to stop...'));
  },
};

module.exports = cmd;