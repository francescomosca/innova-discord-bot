import { Message } from 'discord.js';
import { Command } from '../models/command';
import { __ } from 'i18n';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'ping',
  description: __("command.ping.description"),
  category: 'general',
  args: false,
  async execute(message: Message /*, args: string[] */) {
      message.channel.send('Pong bitch!');
  },
};

module.exports = cmd;