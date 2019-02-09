import { embed } from './../utils/utils';
import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';
import { __ } from 'i18n';

const cmd: Command = {
  name: 'volume',
  description: __("command.volume.description"),
  category: 'music',
  args: false,
  usage: '1-150',
  async execute(message: Message, args: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    let newVol = Number(args[0]);
    if (!newVol) return message.channel.send(__('Volume needs to be a number...'));

    if (newVol < 1 || newVol > 150) return message.channel.send(__('Invalid volume. It needs to be a number from 1 to 150'));

    const musicService = MusicService.getInstance();
    if (musicService.player) {
      /* @todo inviare volume corrente se non ci sono args */
      const oldVol = musicService.player.volume;
      newVol = newVol / 100;
      musicService.player.setVolume(newVol);
      
      return message.channel.send(
        embed.msg("🔊 " +
          __("Volume changed from `{{oldVol}}` to `{{newVol}}`.",
            { oldVol: (oldVol * 100).toString(), newVol: (newVol * 100).toString() })
        ))
        .then(() => musicService.resetCurrentSongData());
    } else return message.channel.send(__("I can't change volume while there are no songs playing..."));
  },
};

module.exports = cmd;