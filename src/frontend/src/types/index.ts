export interface Video {
  title: string;
  thumbnail: string;
  addedBy: string;
  videoId: string;
}

export interface ChatMessage {
  nickname: string;
  message: string;
  timestamp: bigint;
}

export interface User {
  id: string;
  nickname: string;
}

export interface RoomState {
  queue: Video[];
  history: Video[];
  currentVideo?: Video;
  currentTime: number;
  isPlaying: boolean;
  users: User[];
  chatHistory: ChatMessage[];
}

export interface JamSession {
  nickname: string;
  userId: string;
  roomCode: string;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export type NavPage = "home" | "create" | "join" | "search";

// YouTube Player types
declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YTPlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    modestbranding?: 0 | 1;
    enablejsapi?: 0 | 1;
    origin?: string;
    playsinline?: 0 | 1;
  };
  events?: {
    onReady?: (event: YTEvent) => void;
    onStateChange?: (event: YTStateEvent) => void;
    onError?: (event: YTErrorEvent) => void;
  };
}

export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  getVolume(): number;
  destroy(): void;
}

export interface YTEvent {
  target: YTPlayer;
}

export interface YTStateEvent extends YTEvent {
  data: number;
}

export interface YTErrorEvent extends YTEvent {
  data: number;
}
