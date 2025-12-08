/**
 * Server-Side Analytics
 * 
 * Sends analytics events to analytics-service via message bus or direct API.
 * Follows server-side analytics best practices.
 */

export type AnalyticsEventType =
  | 'PageView'
  | 'SignUp'
  | 'PlaySessionStart'
  | 'ReplaySaved'
  | 'ReelPublished'
  | 'PaymentCompleted'
  | 'ClipViewed'
  | 'GameViewed'
  | 'CreatorViewed'
  | 'LiveStreamViewed';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  properties?: Record<string, unknown>;
}

/**
 * Send analytics event to analytics service
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  const analyticsServiceUrl =
    process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3012';

  try {
    // Send to analytics-service API
    const response = await fetch(`${analyticsServiceUrl}/api/analytics/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: event.type,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.properties,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[ANALYTICS] Failed to send event:', response.statusText);
    }
  } catch (error) {
    console.error('[ANALYTICS] Error tracking event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  pathname: string,
  userId?: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'PageView',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      pathname,
      ...properties,
    },
  });
}

/**
 * Track sign up
 */
export async function trackSignUp(
  userId: string,
  method: string = 'email',
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'SignUp',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      method,
      ...properties,
    },
  });
}

/**
 * Track play session start
 */
export async function trackPlaySessionStart(
  userId: string,
  gameId: string,
  sessionId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'PlaySessionStart',
    userId,
    sessionId,
    timestamp: new Date().toISOString(),
    properties: {
      gameId,
      ...properties,
    },
  });
}

/**
 * Track replay saved
 */
export async function trackReplaySaved(
  userId: string,
  replayId: string,
  gameId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'ReplaySaved',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      replayId,
      gameId,
      ...properties,
    },
  });
}

/**
 * Track reel published
 */
export async function trackReelPublished(
  userId: string,
  reelId: string,
  gameId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'ReelPublished',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      reelId,
      gameId,
      ...properties,
    },
  });
}

/**
 * Track payment completed
 */
export async function trackPaymentCompleted(
  userId: string,
  paymentId: string,
  amount: number,
  currency: string,
  properties?: Record<string, unknown>
): Promise<void> {
  await trackEvent({
    type: 'PaymentCompleted',
    userId,
    timestamp: new Date().toISOString(),
    properties: {
      paymentId,
      amount,
      currency,
      ...properties,
    },
  });
}

