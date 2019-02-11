import { StreamDispatcher } from 'discord.js';
export interface Song {
  title: string;
  url: string;
  thumbnailUrl: string;
  dispatcher?: StreamDispatcher;
  requestedBy: string; // @todo rendere opzionale
}
