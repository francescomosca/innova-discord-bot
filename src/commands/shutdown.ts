import { Message, Client } from 'discord.js';

module.exports = {
  name: 'shutdown',
  description: 'Safely shuts down the bot',
  args: false,
  client: true,
  execute(message: Message, args?: string[], client: Client) {
      message.channel.send('Goodbye.')
      .then(() => client.destroy().then(process.exit(1)));
      
  },
};