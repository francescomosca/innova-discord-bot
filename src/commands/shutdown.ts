import { ErrorHandler } from './../errorhandler';
import { Message } from 'discord.js';
import { Command } from '../models/command';
import { __ } from 'i18n';

const cmd: Command = {
  name: 'shutdown',
  description: __("command.shutdown.description"),
  args: false,
  category: "admin",
  async execute(message: Message, /* , _args?: string[] */) {
    await message.channel.send('Goodbye.');
    try {
      // @todo gestire client end ?
      message.client.destroy().then(process.exit(0));
    } catch (err) {
      new ErrorHandler().byError({ errCode: '?', errMessage: err });
    }
  },
};

module.exports = cmd;