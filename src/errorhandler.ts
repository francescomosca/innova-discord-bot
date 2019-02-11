import { Message } from 'discord.js';
import { __ } from 'i18n';

import { logError, logWarn } from './utils/logger';
import { embed, settings } from './utils/utils';
import { E } from './models/errors';

/**
 * @todo Utilizzare un oggetto con gli errori invece dello switch,
 * e all'interno degli oggetti inserire il tipo di errore (info, warn, error)
 */
export class ErrorHandler {

  constructor(private _message?: Message) { }

  public byError(err: E | { errCode: E, errMessage?: any }, ...args: any[]): void {
    // console.debug(`byError received: `, err);
    const msg: Message = this._message;


    let data: { errCode: E | string, errMessage?: any };
    // handle error without the object as parameter
    if (typeof err === "string") data = { errCode: err };
    else data = err;

    logError(`code: ${data.errCode}`);

    let reply: string;
    switch (data.errCode) {
      case E.ArgsNeeded:
        reply = __(`You didn't provide any arguments`);
        const cmd = args[0];
        if (cmd && cmd.usage) reply += `\n${__("Usage")}: \`${settings().prefix}${cmd.name} ${cmd.usage}\``;
        break;
      case E.CommandError:
        reply = __('There was an error trying to execute that command');
         if (data.errMessage) reply += `:\n*${data.errMessage}*`;
        break;
      case E.NoCommand:
        // message.channel.send(`There is no command with that name, ${message.author}`);
        break;
      case E.NoPermission:
        reply = __(`You don't have the permission to do that`);
        break;
      case E.YtNotFound:
        reply = __(`No video found for that query`);
        break;
      case E.LiveContentUnsupported:
        reply = 'Mi dispiace, ma al momento non sono supportati contenuti in diretta.'; // @todo traduzione
        break;
      case E.NoConfig:
        logError(`
        ${__('⚠ ATTENZIONE ⚠')}: 
        ${__('Per avviare il bot è necessario configurare il file "settings.jsonc", che trovi nella cartella config. Ciò è necessario per connettersi a Discord.')}
        `);
        process.exit(0);
        break;
      case E.CommandDisabled:
        reply = __(`That command is currently disabled.`);
        break;
      case E.NoMusicNoStop:
        reply = __('There is no music to stop...');
        break;
      case E.CantDm:
        logError(`Could not send help DM${args[0] ? "to" + args[0] : ""}.\n` + data.errMessage);
        reply = __("command.help.dmError:it seems like I can't DM you! Do you have DMs disabled?");
        break;
      default: // e case '?'
        logError(__('Unknown error') + data.errMessage ? `: ${data.errMessage}` : "");
    }
    if (reply && msg) msg.channel.send(embed.msg("⚠ " + reply));
  }

  byString(errString: string): void {
    const msg: Message = this._message;
    let reply: string;

    if (String(errString).trim().startsWith('Error: No video id found:')) {
      reply = __(`No video id found. You probably sent a wrong url, %s`, msg.author.toString());
    } else {
      logWarn("[byString]" + __('Error message not found'));
    }

    if (reply && msg) msg.channel.send(embed.msg(reply));
  }
}