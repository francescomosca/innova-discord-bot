import { Message } from 'discord.js';
import { __ } from 'i18n';

import { Command } from '../models/command';
import { logDebug } from '../utils/logger';
// import { MusicService } from '../services/music-service';
// import { embed } from '../utils/utils';

const cmd: Command = {
  name: 'add',
  aliases: [],
  description: __("command.add.description"),
  category: 'music',
  args: true,
  usage: '<youtube url | query string>',
  async execute(message: Message, args: string[]): Promise<any> {
    const cleanQuery = args.join(' ');
    logDebug('play args: ' + cleanQuery);

    if (!message.guild) return;

    /*
    const voiceChannel = message.member.voiceChannel;
    if (!voiceChannel) return message.reply(embed.msg(__('Please join a voice channel first!')));

    const musicServ = MusicService.getInstance();
    // @todo assicurarsi che non ripeta la sottoscrizione
    musicServ.songs$.subscribe(
      async _songs => musicServ.play(voiceChannel, message),
      err => Promise.reject(err)
    );
    return musicServ.addSongs(cleanQuery, message.author.id)
      .catch(err => Promise.reject(err));
      */
  },
};

module.exports = cmd;