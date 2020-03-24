export enum OpenError {
    AppNotFound = "AppNotFound",
    ErrorOnLaunch = "ErrorOnLaunch",
    AppTimeout = "AppTimeout",
    ResolverUnavailable = "ResolverUnavailable"
  }
  
  export enum ResolveError {
    NoAppsFound = "NoAppsFound",
    ResolverUnavailable = "ResolverUnavailable",
    ResolverTimeout = "ResolverTimeout"
  }
  
  export enum ChannelError {
    NoChannelFound = "NoChannelFound",
    AccessDenied = "AccessDenied",
    CreationFailed = "CreationFailed"
  }
  