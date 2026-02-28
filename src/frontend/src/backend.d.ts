import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export interface backendInterface {
    addToQueue(roomCode: string, userId: string, videoId: string, title: string, thumbnail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createRoom(nickname: string): Promise<{
        userId: string;
        roomCode: string;
    }>;
    getConnectedUsers(roomCode: string): Promise<{
        __kind__: "ok";
        ok: Array<User>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getRoomState(roomCode: string): Promise<{
        __kind__: "ok";
        ok: {
            queue: Array<Video>;
            history: Array<Video>;
            currentVideo?: Video;
            currentTime: number;
            isPlaying: boolean;
            users: Array<User>;
            chatHistory: Array<ChatMessage>;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    joinRoom(roomCode: string, nickname: string): Promise<{
        __kind__: "ok";
        ok: {
            userId: string;
            roomCode: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    leaveRoom(roomCode: string, userId: string): Promise<void>;
    nextVideo(roomCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    previousVideo(roomCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendChat(roomCode: string, userId: string, message: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setPlayState(roomCode: string, isPlaying: boolean, currentTime: number): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
