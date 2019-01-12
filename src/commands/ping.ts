import { Message } from 'discord.js';
import { Command } from '../models/command';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'ping',
  description: 'Ping!',
  category: 'general',
  args: false,
  async execute(message: Message /*, args: string[] */) {
      message.channel.send('Pong bitch!');
  },
};

module.exports = cmd;