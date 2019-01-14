import { BotSettings } from './../models/bot-settings';
import { ConfigService } from '../services/config-service';

export const stringCapitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * @return BotSettings 
 * @alias ConfigService.getInstance().settings; 
 * */
export const settings = (): BotSettings => ConfigService.getInstance().settings;