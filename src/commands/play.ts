import { Message } from 'discord.js';
import ytdl = require('ytdl-core');

import { SETTINGS } from '../../config/settings.js';
import { ErrorHandler } from '../errorhandler';
import { Command } from '../models/command';
import { logDebug } from '../utils/logger';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'play',
  description: 'Streams a song inside a guild\'s channel.',
  category: 'music',
  args: true,
  usage: '<youtube song url>',
  async execute(message: Message, args: string[]) {
    logDebug('play args: ' + args.join(', '));
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    const voiceChannel = message.member.voiceChannel;

    if (!voiceChannel) return message.reply('please join a voice channel first!');

    voiceChannel.join().then(connection => {
      logDebug('musicQuality: ' + SETTINGS.musicQuality);
      const stream = ytdl(args[0], {
        quality: SETTINGS.musicQuality,
        lang: 'it'
      });
      const dispatcher = connection.playStream(stream);

      dispatcher.on('end', () => voiceChannel.leave());
    }).catch(err => {
      if (voiceChannel.speakable) voiceChannel.leave();
      return new ErrorHandler(message).byString(err);
    });

  },
};

module.exports = cmd;