import { Message } from 'discord.js';
import { Command } from '../models/command';
import { __ } from 'i18n';
import { embed } from '../utils/utils';

const cmd: Command = {
  name: 'ping',
  description: __("command.ping.description"),
  category: 'general',
  args: false,
  async execute(message: Message, _args?: string[]) {
    /* Calcola il ping tra l'invio e la modifica di un messaggio, così da avere una media tra la latenza del bot e della connessione a Discord */
    let m = await message.channel.send("Pong");

    if (Array.isArray(m)) m = m[0];
    const latency: number = m.createdTimestamp - message.createdTimestamp;
    const apiLatency: number = Math.round(message.client.ping);

    if (m.editable) m.edit(embed.ping(apiLatency, latency));
    else if (m.deletable) {
      m.delete();
      message.channel.send(embed.ping(apiLatency, latency));
    } else Promise.reject('not_editable_or_deletable'); // @todo
  },
};

module.exports = cmd;