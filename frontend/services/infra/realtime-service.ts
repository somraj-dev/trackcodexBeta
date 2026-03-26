import { io, Socket } from "socket.io-client";
import { API_URL } from '../infra/api';

export type RealtimeEvent = {
  type: string;
  payload?: any;
  [key: string]: any;
};

export type Listener = (event: RealtimeEvent) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private listeners: Set<Listener> = new Set();
  private userId: string | null = null;
  private workspaceId: string | null = null;

  connect(userId: string, workspaceId?: string) {
    if (this.socket && this.userId === userId && this.workspaceId === (workspaceId || null)) return;

    this.userId = userId;
    this.workspaceId = workspaceId || null;

    if (this.socket) {
      this.socket.disconnect();
    }

    const host = API_URL || "https://api.trackcodex.com";
    console.log(`🔌 Connecting to Realtime: ${host}`);

    this.socket = io(host, {
      query: { userId, workspaceId },
      transports: ["polling", "websocket"],
      withCredentials: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Realtime connection established");
      this.notify({ type: "CONNECTION_OPEN" });
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("⚠️ Realtime connection closed:", reason);
      this.notify({ type: "CONNECTION_CLOSED", reason });
    });

    this.socket.on("connect_error", (err) => {
      console.warn("⚠️ Realtime connection error:", err.message);
    });

    const forwardEvent = (type: string) => {
      this.socket?.on(type, (data) => {
        this.notify({ ...data, type });
        if (type === "NOTIFICATION") {
           window.dispatchEvent(new CustomEvent("trackcodex-notification", { detail: data.data || data }));
        }
      });
    };

    forwardEvent("PRESENCE_UPDATE");
    forwardEvent("REPOSITORY_UPDATE");
    forwardEvent("WORKSPACE_UPDATE");
    forwardEvent("ACTIVITY_EVENT");
    forwardEvent("CURSOR_MOVE");
    forwardEvent("BUFFER_SYNC");
    forwardEvent("TERMINAL_OUTPUT");
    forwardEvent("NOTIFICATION");
    forwardEvent("USER_FOLLOW");
    forwardEvent("PR_UPDATED");
    forwardEvent("NEW_COMMENT");
    forwardEvent("POST_LIKED");
    forwardEvent("new_message");
    forwardEvent("TYPING_START");
    forwardEvent("TYPING_STOP");
    forwardEvent("REACTION_UPDATE");
  }

  send(event: RealtimeEvent) {
    if (this.socket?.connected) {
      // Use the event.type as the Socket.io event name
      const { type, ...payload } = event;
      this.socket.emit(type, payload);
    } else {
      console.warn("⚠️ Cannot send: Realtime socket not connected");
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach((l) => l(event));
  }

  disconnect() {
    this.userId = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const realtimeService = new RealtimeService();


