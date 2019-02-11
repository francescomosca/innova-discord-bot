import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { logError } from '../utils/logger';
import { __ } from 'i18n';
import { embed } from '../utils/utils';

const cmd: Command = {
  name: 'queue',
  aliases: ['list', 'songqueue'],
  description: __("command.queue.description:View the song queue"),
  category: 'music',
  args: false,
  // usage: '<youtube url | query string>',
  async execute(message: Message, _args?: string[]): Promise<any> {
    /* @todo paginazione con args[0] */
    // const cleanQuery = args.join(' ');
    // logDebug('queue args: ' + cleanQuery);

    if (!message.guild) return;

    const musicServ = MusicService.getInstance();

    let songList: string = '';
    if (musicServ.songs.length) musicServ.songs.forEach((song, i) => {
      songList += `${i == 0 ? '**Corrente:**' : "`" + (i + 1) + '`'} ${song.title}\n`;
    });
    else songList = '*' + __("command.queue.nosongs:No songs in the queue") + '...*';

    return message.channel.send(embed.queue(songList))
      .then(() => { })
      .catch(error => {
        logError(`Could not send help to ${message.author.tag}.\n` + error);
        console.error(error);
      });
  },
};

module.exports = cmd;