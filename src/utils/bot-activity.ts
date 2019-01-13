import { ActivityType, Message, ClientUser } from "discord.js";
import { SETTINGS } from '../../config/settings.js';

export const setBotActivity = (
  message: Message | ClientUser,
  text: string | "default" = SETTINGS.defaultActivity,
  activity: ActivityType = "LISTENING",
) => {
  if (text == "default") text = SETTINGS.defaultActivity;

  if (message instanceof Message) return message.client.user.setActivity(text, { type: activity });
  else return message.setActivity(text, { type: activity });
};