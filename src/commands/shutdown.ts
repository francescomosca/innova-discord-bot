import { ErrorHandler } from './../errorhandler';
import { Message } from 'discord.js';
import { Command } from '../models/command';
// import { Command } from './../models/command';

const cmd: Command = {
  name: 'shutdown',
  description: 'Safely shuts down the bot',
  args: false,
  category: "admin",
  async execute(message: Message, /* , _args?: string[] */) {
    await message.channel.send('Goodbye.');
    try {
      message.client.destroy().then(process.exit(0));
    } catch (err) {
      new ErrorHandler().byError({ errCode: '?', errMessage: err });
    }
  },
};

module.exports = cmd;