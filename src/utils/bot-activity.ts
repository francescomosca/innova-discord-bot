import { ActivityType, Message, ClientUser } from "discord.js";
import { settings } from "./utils";

export const setBotActivity = (
  message: Message | ClientUser,
  text?: string,
  activity: ActivityType = "LISTENING",
) => {
  if (!text || text == "" || text == "default") text = settings().defaultActivity;

  if (message instanceof Message) return message.client.user.setActivity(text, { type: activity });
  else return message.setActivity(text, { type: activity });
};