/**
 * Event Bus Abstraction
 *
 * Provides a unified interface for event publishing/consuming
 * Supports both Kafka and NATS (configurable via environment)
 */
export interface Event {
    type: string;
    payload: Record<string, unknown>;
    timestamp: string;
    source: string;
}
export interface EventBus {
    publish(topic: string, event: Event): Promise<void>;
    subscribe(topic: string, handler: (event: Event) => Promise<void>): Promise<void>;
    disconnect(): Promise<void>;
}
/**
 * Get event bus instance
 *
 * In production, this should return Kafka or NATS implementation
 */
export declare function getEventBus(): EventBus;
/**
 * Helper to create and publish events
 */
export declare function publishEvent(topic: string, type: string, payload: Record<string, unknown>, source?: string): Promise<void>;
/**
 * Event Topics
 */
export declare const EventTopics: {
    readonly SESSIONS: "sessions";
    readonly REPLAYS: "replays";
    readonly RENDERS: "renders";
    readonly PAYMENTS: "payments";
    readonly ANALYTICS: "analytics-events";
    readonly MODERATION: "moderation";
    readonly CLIPS: "clips";
    readonly USERS: "users";
};
/**
 * Event Types
 */
export declare const EventTypes: {
    readonly SESSION_STARTED: "SessionStarted";
    readonly SESSION_ENDED: "SessionEnded";
    readonly REPLAY_CREATED: "ReplayCreated";
    readonly REPLAY_FAILED: "ReplayFailed";
    readonly RENDER_REQUESTED: "RenderRequested";
    readonly RENDER_COMPLETED: "RenderCompleted";
    readonly RENDER_FAILED: "RenderFailed";
    readonly PAYMENT_COMPLETED: "PaymentCompleted";
    readonly PAYMENT_FAILED: "PaymentFailed";
    readonly PAGE_VIEWED: "PageViewed";
    readonly CLIP_VIEWED: "ClipViewed";
    readonly REPLAY_SAVED: "ReplaySaved";
    readonly REEL_PUBLISHED: "ReelPublished";
    readonly SUBSCRIPTION_STARTED: "SubscriptionStarted";
    readonly CONTENT_FLAGGED: "ContentFlagged";
    readonly USER_BANNED: "UserBanned";
    readonly CLIP_PUBLISHED: "ClipPublished";
    readonly USER_CREATED: "UserCreated";
    readonly USER_UPDATED: "UserUpdated";
    readonly VM_PROVISIONED: "VMProvisioned";
    readonly VM_READY: "VMReady";
    readonly VM_ERROR: "VMError";
    readonly VM_POOL_LOW_CAPACITY: "VMPoolLowCapacity";
    readonly VM_TERMINATED: "VMTerminated";
};
