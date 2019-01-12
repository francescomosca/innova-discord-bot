import { ErrorHandler } from './../errorhandler';
import { Message } from 'discord.js';
// import { Command } from './../models/command';

module.exports = {
  name: 'shutdown',
  description: 'Safely shuts down the bot',
  args: false,
  async execute(message: Message, /* , _args?: string[] */) {

    await message.channel.send('Goodbye.');
    try {
      message.client.destroy().then(process.exit(1)); // @todo fix me
    } catch (err) {
      new ErrorHandler().byError({ errCode: '?', errMessage: err });
    }

  },
};