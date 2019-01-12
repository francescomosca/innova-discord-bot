import { Message } from 'discord.js';
// import { Command } from './../models/command';

module.exports = {
  name: 'ping',
  description: 'Ping!',
  args: false,
  client: false,
  execute(message: Message /*, args: string[] */) {
      message.channel.send('Pong bitch!');
  },
};