import { Message } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { MusicService } from '../services/music-service';

const cmd: Command = {
  name: 'skip',
  aliases: ['next'],
  description: __("command.stop.description"),
  category: 'music',
  args: false,
  async execute(message: Message, _args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    // const voiceChannel = message.member.voiceChannel;
    // if (!voiceChannel) return message.reply('please join a voice channel first!');
    
    const musicServ = MusicService.getInstance();

    return musicServ.stop(message.author.username, 'Skipped from command', true);
      // .catch(Promise.reject);
  },
};

module.exports = cmd;