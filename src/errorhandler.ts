import { Message } from 'discord.js';
import { logError } from './utils/logger';

export class ErrorHandler {

  private _message: Message;

  constructor(message?: Message) {
    if (message) this._message = message;
  }

  public byErrorString(error: string): void {
    const message: Message = this._message;
    
    switch (error) {
      case 'args_needed':
        message.channel.send(`You didn't provide any arguments, ${message.author}!`);
        break;
      case 'command_error':
        logError(`code: ${error}`);
        message.channel.send('There was an error trying to execute that command!');
        break;
      case 'no_command':
        message.channel.send(`There is no command with that name, ${message.author}`);
        break;
      default:
      // errore inaspettato
    }
  }
}