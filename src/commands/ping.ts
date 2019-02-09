import { Message } from 'discord.js';
import { Command } from '../models/command';
import { __ } from 'i18n';
import { embed } from '../utils/utils';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'ping',
  description: __("command.ping.description"),
  category: 'general',
  args: false,
  async execute(message: Message /*, args: string[] */) {
    // Calcola il ping tra l'invio e la modifica di un messaggio, così da avere una media tra la latenza del bot e quella della connessione a Discord
    let m = await message.channel.send("...");

    if (Array.isArray(m)) m = m[0];
    const latency: number = m.createdTimestamp - message.createdTimestamp;
    const apiLatency: number = Math.round(message.client.ping);

    const msgContent =
      ":regional_indicator_p::regional_indicator_o::regional_indicator_n::regional_indicator_g:" + `\n\nAPI latency: \`${apiLatency}ms\` - Total latency: \`${latency}ms\``;

    if (m.editable) m.edit(embed.msg(msgContent, false));
    else if (m.deletable) {
      m.delete();
      message.channel.send(embed.msg(msgContent, false));
    } else Promise.reject('not_editable_or_deletable'); // @todo
  },
};

module.exports = cmd;