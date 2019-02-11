import { embed, settings } from './../utils/utils';
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
  async execute(message: Message, args?: string[]): Promise<any> {
    // Ignore messages that aren't from a guild
    if (!message.guild) return;
    const maxVol = Number(settings().maxVolume);

    const newVol: number = Number(args[0]);

    // se non è un numero o è errato (rileva il NaN)
    if (args.length && (!newVol || newVol < 1 || newVol > maxVol)) return message.channel.send(
      __("The volume needs to be a number from `1` to `%s`", maxVol.toString()));

    const musicServ = MusicService.getInstance();
    const dispatcher = musicServ.currentSong.dispatcher;
    // dev'esserci qualcosa in riproduzione, quindi:
    if (dispatcher) {
      const oldVol = dispatcher.volume * 100; // player.volume ragiona da 0.00 a 1.00

      if (newVol) { // se l'intenzione è di cambiare volume
        dispatcher.setVolume(newVol / 100);
        return message.channel.send(
          embed.msg("🔊 " +
            __("command.volume.changed:Volume changed from `{{oldVol}}%` to `{{newVol}}%`.",
              { oldVol: oldVol.toString(), newVol: newVol.toString() })
            , false));
      } else { // altrimenti mostra il volume
        message.channel.send(embed.msg("🔊 " +
          __('command.volume.current:Current volume: {{vol}}%', { vol: oldVol.toString() })
          , false));
      }

    } else return message.channel.send(embed.msg(
      __("I can't say or change the volume while there are no songs playing...")));

  },
};

module.exports = cmd;