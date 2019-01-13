import { Message } from 'discord.js';

import { MusicService } from '../services/music-service';
import { Command } from '../models/command';

const cmd: Command = {
  name: 'volume',
  description: 'Change the volume of the player.',
  category: 'music',
  args: true,
  usage: '1-150',
  async execute(message: Message, args: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;

    let newVol = Number(args[0]);
    if (!newVol) return message.channel.send('Volume needs to be a number...');

    if (newVol < 1 || newVol > 150) return message.channel.send('Invalid volume. It needs to be a number from 1 to 150');

    const musicService = MusicService.getInstance();
    if (musicService.player) {
      const oldVol = musicService.player.volume * 100;
      newVol = newVol / 100;
      musicService.player.setVolume(newVol);
      return message.channel.send(`Volume changed from \`${oldVol}\` to \`${newVol * 100}\`.`)
        .then(() => musicService.resetCurrentSongData());
    } else return message.channel.send('I can\'t change volume while there are no songs playing...');
  },
};

module.exports = cmd;