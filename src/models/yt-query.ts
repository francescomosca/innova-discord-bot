export interface YtQuery extends Object {
  kind: string;
  url: string;
  publishedAt: string | Date;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: {
      url: string,
      width: number,
      height: number
    },
    medium: {
      url: string,
      width: number,
      height: number
    },
    high: {
      url: string,
      width: number,
      height: number
    }
  };
  channelTitle: string;
  liveBroadcastContent: 'none';
}