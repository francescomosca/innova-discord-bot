export interface YtQuery extends Object {
  url: string;
  title: string;
  description?: string;
  kind?: string;
  publishedAt?: string | Date;
  thumbnails?: {
    default?: {
      url?: string,
      width?: number,
      height?: number
    },
    medium?: {
      url?: string,
      width?: number,
      height?: number
    },
    high?: {
      url?: string,
      width?: number,
      height?: number
    }
  };
  channelId?: string;
  channelTitle?: string;
  liveBroadcastContent?: string;
}