import { Message } from 'discord.js';

import { SETTINGS } from '../config/settings.js';
import { Command } from './models/command';
import { logError, logDebug } from './utils/logger';

export class ErrorHandler {

  constructor(
    private _message?: Message
  ) { }

  public byError(err: string | { errCode: string, errMessage?: any, command?: Command }): void {
    // console.debug(`byError received: `, err);
    const message: Message = this._message;

    let reply: string;

    let data: { errCode: string, errMessage?: any, command?: Command };
    if (typeof err === "string") {
      data = { errCode: err };
    } else data = err;

    switch (data.errCode) {
      case 'args_needed':
        reply = `You didn't provide any arguments, ${message.author}!`;
        if (data.command && data.command.usage) {
          reply += `\nUsage: '${SETTINGS.prefix}${data.command.name} ${data.command.usage}'`;
        }
        message.channel.send(reply);
        break;
      case 'command_error':
        logError(`code: ${err}`);
        message.channel.send('There was an error trying to execute that command!');
        break;
      case 'no_command':
        logDebug(`code: ${err}`);
        message.channel.send(`There is no command with that name, ${message.author}`);
        break;
      case 'no_permission':
        logDebug(`code: ${err}`);
        message.channel.send(`You don't have the permission to do that, ${message.author}`);
        break;
      case 'yt_not_found':
        logDebug(`code: ${err}`);
        message.channel.send(`No video found for that query`);
        break;
      default: // e case '?'
        reply = 'Unknown error';
        if (data.errMessage) reply += `: ${data.errMessage}`;
        logError(reply);
    }
  }

  public byString(errString: string): void {
    const message: Message = this._message;

    if (String(errString).trim().startsWith('Error: No video id found:')) {
      message.channel.send(`No video id found. You probably sent a wrong url, ${message.author}`);
    } else {
      
    }

  }
}