import { ErrorHandler } from './../errorhandler';
import { Message } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { MusicService } from '../services/music-service';
import { embed } from '../utils/utils';
import { E } from '../models/errors';

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
    if (musicService.currentPlayer) {
      message.channel.send(embed.msg(
        '⏹ ' + __("`{{songName}}` stopped by {{user}}",
        { songName: musicService.currentSong.title, user: message.author.username })));
        // .then(() => musicService.resetCurrentSongData());
        musicService.currentPlayer.end('Stopped from command');
    } else return new ErrorHandler(message).byError(E.NoMusicNoStop);
  },
};

module.exports = cmd;