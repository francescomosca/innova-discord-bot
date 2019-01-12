import { Message } from 'discord.js';

import { prefix } from '../config/settings.js';
import { Command } from './models/command';
import { logError, logVerbose } from './utils/logger';

export class ErrorHandler {

  constructor(
    private _message?: Message
  ) { }

  public byError(err: string | { errCode: string, errMessage?: any, command?: Command }): void {
    const message: Message = this._message;

    let reply: string;

    let data: { errCode: string, errMessage?: any, command?: Command };
    if (typeof err == "string") {
      data = { errCode: err };
    } else data = err;

    switch (err) {
      case 'args_needed':
        reply = `You didn't provide any arguments, ${message.author}!`;
        if (data.command && data.command.usage) {
          reply += `\nUsage: '${prefix}${data.command.name} ${data.command.usage}'`;
        }
        message.channel.send(reply);
        break;
      case 'command_error':
        logError(`code: ${err}`);
        message.channel.send('There was an error trying to execute that command!');
        break;
      case 'no_command':
        logVerbose(`code: ${err}`);
        message.channel.send(`There is no command with that name, ${message.author}`);
        break;
      default: // e case '?'
        reply = 'Unexpected error';
        if (data.errMessage) reply += `: ${data.errMessage}`;
        logError(reply);
    }
  }
}