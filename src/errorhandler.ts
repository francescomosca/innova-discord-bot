import { Message } from 'discord.js';

import { Command } from './models/command';
import { logError } from './utils/logger';
import { settings } from './utils/utils';
import { __ } from 'i18n';

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

    logError(`code: ${data.errCode}`);
    switch (data.errCode) {
      case 'args_needed':
        reply = __(`You didn't provide any arguments, %s!`, "" + message.author);
        if (data.command && data.command.usage) {
          reply += `\n${__("Usage")}: \`${settings().prefix}${data.command.name} ${data.command.usage}\``;
        }
        message.channel.send("⚠ " + reply);
        break;
      case 'command_error':
        message.channel.send("⚠ " + __('There was an error trying to execute that command'));
        break;
      case 'no_command':
        // message.channel.send(`There is no command with that name, ${message.author}`);
        break;
      case 'no_permission':
        message.channel.send("⚠ " + __(`You don't have the permission to do that, %s`, "" + message.author));
        break;
      case 'yt_not_found':
        message.channel.send("⚠ " + __(`No video found for that query`));
        break;
      case 'live_content_unsupported':
        message.channel.send("⚠ " + 'Mi dispiace, ma al momento non sono supportati contenuti in diretta.\n*...Per ora...*'); // @todo traduzione
        break;
      case 'no_config':
        logError(`
        ${__('ATTENZIONE')}: 
        
        ${__('Per avviare il bot è necessario configurare il file "settings.jsonc", che trovi nella cartella config. Ciò è necessario per connettersi a Discord.')}
        `);
        process.exit(0);
        break;
      case 'command_disabled':
        message.channel.send("⚠ " + __(`That command is currently disabled.`));
        break;
      default: // e case '?'
        reply = __('Unknown error');
        if (data.errMessage) reply += `: ${data.errMessage}`;
        logError(reply);
    }
  }

  public byString(errString: string): void {
    const message: Message = this._message;

    if (String(errString).trim().startsWith('Error: No video id found:')) {
      message.channel.send(__(`No video id found. You probably sent a wrong url, %s`, "" + message.author));
    } /* else {

    } */

  }
}