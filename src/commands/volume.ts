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

    const reqVol: number = Number(args[0]);

    // se non è un numero o è errato (rileva il NaN)
    if (args.length && (!reqVol || reqVol < 1 || reqVol > maxVol)) return message.channel.send(embed.msg(
      __("The volume needs to be a number from `1` to `%s`", maxVol.toString()),
      false
    ));

    const musicServ = MusicService.getInstance();

    // Se vuole solo sapere il volume corrente
    if (!reqVol) return message.channel.send(embed.msg("🔊 " +
      __('command.volume.current:Current volume: {{vol}}%', 
      { vol: (musicServ.lastVolume * 100).toString() })
      , false));

    let oldVol: number;

    // se vuole modificarlo
    if (musicServ.currentSong) {
      // aggiorno sia il dispatcher che lastVolume
      // player.volume ragiona da 0.00 a 1.00
      oldVol = musicServ.currentSong.dispatcher.volume * 100;
      musicServ.currentSong.dispatcher.setVolume(reqVol / 100);
    } else {
      // mi prendo solo il vecchio valore
      oldVol = musicServ.lastVolume * 100;
    }

    // aggiorno lastVolume
    musicServ.lastVolume = reqVol / 100;

    return message.channel.send(
      embed.msg("🔊 " +
        __("command.volume.changed:Volume changed from `{{oldVol}}%` to `{{newVol}}%`.",
          { oldVol: oldVol.toString(), newVol: reqVol.toString() })
        , false));
  },
};

module.exports = cmd;