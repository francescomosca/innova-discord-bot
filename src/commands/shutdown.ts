import { embed } from './../utils/utils';
import { ErrorHandler } from './../errorhandler';
import { Message } from 'discord.js';
import { Command } from '../models/command';
import { __ } from 'i18n';
import { E } from '../models/errors';

const cmd: Command = {
  name: 'shutdown',
  description: __("command.shutdown.description"),
  args: false,
  category: "admin",
  async execute(message: Message, _args?: string[]) {
    await message.channel.send(embed.msg(`${__('command.shutdown.message:Goodbye')} :zzz:`));
    try {
      // @todo gestire client end ?
      message.client.destroy().then(process.exit(0));
    } catch (err) {
      new ErrorHandler().byError({ errCode: E.Unknown, errMessage: err });
    }
  },
};

module.exports = cmd;