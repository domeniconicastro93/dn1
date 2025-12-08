"use strict";
/**
 * Event Bus Abstraction
 *
 * Provides a unified interface for event publishing/consuming
 * Supports both Kafka and NATS (configurable via environment)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypes = exports.EventTopics = void 0;
exports.getEventBus = getEventBus;
exports.publishEvent = publishEvent;
/**
 * In-Memory Event Bus (for development/testing)
 *
 * In production, this should be replaced with Kafka or NATS implementation
 */
class InMemoryEventBus {
    subscribers = new Map();
    async publish(topic, event) {
        const handlers = this.subscribers.get(topic) || [];
        // Log event for debugging
        console.log(`[EVENT] ${topic}:`, event);
        // Call all subscribers
        await Promise.all(handlers.map(async (handler) => {
            try {
                await handler(event);
            }
            catch (error) {
                console.error(`[EVENT] Error in handler for ${topic}:`, error);
            }
        }));
    }
    async subscribe(topic, handler) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic).push(handler);
    }
    async disconnect() {
        this.subscribers.clear();
    }
}
// Singleton instance
let eventBusInstance = null;
/**
 * Get event bus instance
 *
 * In production, this should return Kafka or NATS implementation
 */
function getEventBus() {
    if (!eventBusInstance) {
        const eventBusType = process.env.EVENT_BUS_TYPE || 'memory';
        if (eventBusType === 'kafka') {
            // TODO: Implement Kafka event bus
            // eventBusInstance = new KafkaEventBus();
            console.warn('[EVENT_BUS] Kafka not implemented, using in-memory');
            eventBusInstance = new InMemoryEventBus();
        }
        else if (eventBusType === 'nats') {
            // TODO: Implement NATS event bus
            // eventBusInstance = new NATSEventBus();
            console.warn('[EVENT_BUS] NATS not implemented, using in-memory');
            eventBusInstance = new InMemoryEventBus();
        }
        else {
            eventBusInstance = new InMemoryEventBus();
        }
    }
    return eventBusInstance;
}
/**
 * Helper to create and publish events
 */
async function publishEvent(topic, type, payload, source = 'unknown') {
    const event = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        source,
    };
    await getEventBus().publish(topic, event);
}
/**
 * Event Topics
 */
exports.EventTopics = {
    SESSIONS: 'sessions',
    REPLAYS: 'replays',
    RENDERS: 'renders',
    PAYMENTS: 'payments',
    ANALYTICS: 'analytics-events',
    MODERATION: 'moderation',
    CLIPS: 'clips',
    USERS: 'users',
};
/**
 * Event Types
 */
exports.EventTypes = {
    // Sessions
    SESSION_STARTED: 'SessionStarted',
    SESSION_ENDED: 'SessionEnded',
    // Replays
    REPLAY_CREATED: 'ReplayCreated',
    REPLAY_FAILED: 'ReplayFailed',
    // Renders
    RENDER_REQUESTED: 'RenderRequested',
    RENDER_COMPLETED: 'RenderCompleted',
    RENDER_FAILED: 'RenderFailed',
    // Payments
    PAYMENT_COMPLETED: 'PaymentCompleted',
    PAYMENT_FAILED: 'PaymentFailed',
    // Analytics
    PAGE_VIEWED: 'PageViewed',
    CLIP_VIEWED: 'ClipViewed',
    REPLAY_SAVED: 'ReplaySaved',
    REEL_PUBLISHED: 'ReelPublished',
    SUBSCRIPTION_STARTED: 'SubscriptionStarted',
    // Moderation
    CONTENT_FLAGGED: 'ContentFlagged',
    USER_BANNED: 'UserBanned',
    // Clips
    CLIP_PUBLISHED: 'ClipPublished',
    // Users
    USER_CREATED: 'UserCreated',
    USER_UPDATED: 'UserUpdated',
    // Orchestrator
    VM_PROVISIONED: 'VMProvisioned',
    VM_READY: 'VMReady',
    VM_ERROR: 'VMError',
    VM_POOL_LOW_CAPACITY: 'VMPoolLowCapacity',
    VM_TERMINATED: 'VMTerminated',
};
