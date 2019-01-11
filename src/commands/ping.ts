import { Message } from 'discord.js';
module.exports = {
  name: 'ping',
  description: 'Ping!',
  args: false,
  execute(message: Message /*, args: string[] */) {
      message.channel.send('Pong bitch!');
  },
};