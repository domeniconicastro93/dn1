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
 * In-Memory Event Bus (for development/testing)
 * 
 * In production, this should be replaced with Kafka or NATS implementation
 */
class InMemoryEventBus implements EventBus {
  private subscribers: Map<string, Array<(event: Event) => Promise<void>>> = new Map();

  async publish(topic: string, event: Event): Promise<void> {
    const handlers = this.subscribers.get(topic) || [];
    
    // Log event for debugging
    console.log(`[EVENT] ${topic}:`, event);

    // Call all subscribers
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`[EVENT] Error in handler for ${topic}:`, error);
        }
      })
    );
  }

  async subscribe(topic: string, handler: (event: Event) => Promise<void>): Promise<void> {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)!.push(handler);
  }

  async disconnect(): Promise<void> {
    this.subscribers.clear();
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

/**
 * Get event bus instance
 * 
 * In production, this should return Kafka or NATS implementation
 */
export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    const eventBusType = process.env.EVENT_BUS_TYPE || 'memory';
    
    if (eventBusType === 'kafka') {
      // TODO: Implement Kafka event bus
      // eventBusInstance = new KafkaEventBus();
      console.warn('[EVENT_BUS] Kafka not implemented, using in-memory');
      eventBusInstance = new InMemoryEventBus();
    } else if (eventBusType === 'nats') {
      // TODO: Implement NATS event bus
      // eventBusInstance = new NATSEventBus();
      console.warn('[EVENT_BUS] NATS not implemented, using in-memory');
      eventBusInstance = new InMemoryEventBus();
    } else {
      eventBusInstance = new InMemoryEventBus();
    }
  }

  return eventBusInstance;
}

/**
 * Helper to create and publish events
 */
export async function publishEvent(
  topic: string,
  type: string,
  payload: Record<string, unknown>,
  source: string = 'unknown'
): Promise<void> {
  const event: Event = {
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
export const EventTopics = {
  SESSIONS: 'sessions',
  REPLAYS: 'replays',
  RENDERS: 'renders',
  PAYMENTS: 'payments',
  ANALYTICS: 'analytics-events',
  MODERATION: 'moderation',
  CLIPS: 'clips',
  USERS: 'users',
} as const;

/**
 * Event Types
 */
export const EventTypes = {
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
} as const;

