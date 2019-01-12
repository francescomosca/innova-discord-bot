import { ErrorHandler } from './../errorhandler';
import { Client, Message } from 'discord.js';
// import { Command } from './../models/command';

module.exports = {
  name: 'shutdown',
  description: 'Safely shuts down the bot',
  args: false,
  client: true,
  async execute(message: Message, client: Client /* , _args?: string[] */) {

    await message.channel.send('Goodbye.');
    try {
      client.destroy().then(process.exit(1)); // @todo fix me
    } catch (err) {
      new ErrorHandler().byError({ errCode: '?', errMessage: err });
    }

  },
};