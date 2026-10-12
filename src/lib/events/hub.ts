// NovaMart Real-Time Event Bus & Pub/Sub Hub
// Enables instant live synchronization between Customer Chat and Agent Workspace

import { EventEmitter } from "events";

export interface SystemEvent {
  id: string;
  channel: string;
  type: "NEW_MESSAGE" | "AGENT_TAKEOVER" | "STATUS_CHANGE" | "TICKET_CREATED" | "TICKET_UPDATED" | "ADMIN_DISPATCH" | "PING";
  payload: any;
  timestamp: string;
}

class EventHub {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  public publish(channel: string, type: SystemEvent["type"], payload: any): SystemEvent {
    const event: SystemEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      channel,
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    // Emit on specific channel and global stream
    this.emitter.emit(channel, event);
    this.emitter.emit("*", event);
    return event;
  }

  public subscribe(channel: string, callback: (event: SystemEvent) => void): () => void {
    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
    };
  }

  // Convenience dispatchers
  public notifyNewMessage(conversationId: string, message: any) {
    this.publish(`conversation:${conversationId}`, "NEW_MESSAGE", { conversationId, message });
    this.publish("agent:inbox", "NEW_MESSAGE", { conversationId, message });
  }

  public notifyAgentTakeover(conversationId: string, agent: any) {
    this.publish(`conversation:${conversationId}`, "AGENT_TAKEOVER", { conversationId, agent });
    this.publish("agent:inbox", "STATUS_CHANGE", { conversationId, status: "AGENT_ACTIVE" });
  }

  public notifyStatusChange(conversationId: string, status: string, details?: any) {
    this.publish(`conversation:${conversationId}`, "STATUS_CHANGE", { conversationId, status, details });
    this.publish("agent:inbox", "STATUS_CHANGE", { conversationId, status, details });
  }

  public notifyTicketCreated(ticket: any) {
    this.publish("agent:tickets", "TICKET_CREATED", { ticket });
    this.publish("agent:inbox", "TICKET_CREATED", { ticket });
    if (ticket.conversationId) {
      this.publish(`conversation:${ticket.conversationId}`, "TICKET_CREATED", { ticket });
    }
  }
}

const globalForEvents = globalThis as unknown as {
  eventHub: EventHub | undefined;
};

export const eventHub = globalForEvents.eventHub ?? new EventHub();
if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventHub = eventHub;
}
