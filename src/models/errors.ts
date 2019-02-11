/**
 * Contiene le definizioni degli errori conosciuti.
 * 
 *  Per aggiungere un nuovo errore, aggiornare questo enum e lo switch di `ErrorHandler`
 * @class ErrorHandler
 */
export enum E {
  ArgsNeeded = "args_needed",
  CommandError = "command_error",
  NoCommand = "no_command",
  NoPermission = "no_permission",
  YtNotFound = "yt_not_found",
  LiveContentUnsupported = "live_content_unsupported",
  NoConfig = "no_config",
  CommandDisabled = "command_disabled",
  NoMusicNoStop = "no_music_no_stop",
  CantDm = "cant_dm",
  Unknown = "?",
  GoogleQuotaExceeded = "google_quotaExceeded",
  GoogleDailyLimitExceeded = "google_dailyLimitExceeded"
}