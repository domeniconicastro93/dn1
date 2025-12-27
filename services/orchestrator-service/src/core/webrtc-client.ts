/**
 * WebRTC Client for Orchestrator Service
 * 
 * Centralized client for webrtc-streaming-service
 * Ensures single source of truth for WebRTC session management
 */

const WEBRTC_SERVICE_URL = process.env.WEBRTC_SERVICE_URL || 'http://108.142.237.74:3015';

export interface WebRTCSessionConfig {
    width?: number;
    height?: number;
    fps?: number;
    bitrate?: number;
}

export interface WebRTCSessionStartResponse {
    sessionId: string;
    offer: any;
}

/**
 * WebRTC Client - Single source of truth for webrtc-streaming-service calls
 */
export class WebRTCClient {
    private serviceUrl: string;

    constructor(serviceUrl?: string) {
        this.serviceUrl = serviceUrl || WEBRTC_SERVICE_URL;
        console.log('[WebRTCClient] Initialized with URL:', this.serviceUrl);
    }

    /**
     * Start a WebRTC streaming session
     */
    async startSession(
        sessionId: string,
        config: WebRTCSessionConfig = {}
    ): Promise<{ offer: any }> {
        const { width = 1920, height = 1080, fps = 60, bitrate = 10000 } = config;

        console.log('[ORCH → VM] calling WebRTC start at', this.serviceUrl);
        console.log('[ORCH → VM] sessionId=', sessionId);
        console.log('[ORCH → VM] expected bitrate=', bitrate);
        console.log('[ORCH → VM] resolution=', `${width}x${height}@${fps}fps`);

        const targetUrl = `${this.serviceUrl}/webrtc/session/${sessionId}/start`;
        console.log('[ORCH → VM] Full URL:', targetUrl);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ width, height, fps, bitrate }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[ORCH → VM] ❌ WebRTC service error:', response.status, error);
            throw new Error(`WebRTC service error (${response.status}): ${error}`);
        }

        const data: any = await response.json();
        console.log('[WebRTCClient] ✅ Session started, offer received');

        // Log SDP details
        if (data.offer && data.offer.sdp) {
            console.log('[SDP OFFER SIZE]=', data.offer.sdp.length, 'chars');
            console.log('[SDP OFFER SNIPPET]=', data.offer.sdp.substring(0, 200));
        }

        return { offer: data.offer };
    }

    /**
     * Send answer to WebRTC service
     */
    async sendAnswer(sessionId: string, answer: any): Promise<void> {
        console.log('[WebRTCClient] Sending answer for session:', sessionId);

        const response = await fetch(`${this.serviceUrl}/webrtc/session/${sessionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
        });

        if (!response.ok) {
            throw new Error(`WebRTC service error: ${response.status}`);
        }

        console.log('[WebRTCClient] ✅ Answer sent');
    }

    /**
     * Send ICE candidate to WebRTC service
     */
    async sendIceCandidate(sessionId: string, candidate: any): Promise<void> {
        console.log('[WebRTCClient] Sending ICE candidate for session:', sessionId);

        const response = await fetch(`${this.serviceUrl}/webrtc/session/${sessionId}/ice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ candidate }),
        });

        if (!response.ok) {
            throw new Error(`WebRTC service error: ${response.status}`);
        }

        console.log('[WebRTCClient] ✅ ICE candidate sent');
    }

    /**
     * Stop a WebRTC streaming session
     */
    async stopSession(sessionId: string): Promise<void> {
        console.log('[WebRTCClient] Stopping session:', sessionId);

        const response = await fetch(`${this.serviceUrl}/webrtc/session/${sessionId}/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`WebRTC service error: ${response.status}`);
        }

        console.log('[WebRTCClient] ✅ Session stopped');
    }

    /**
     * Get service URL
     */
    getServiceUrl(): string {
        return this.serviceUrl;
    }
}

// Singleton instance
let webrtcClientInstance: WebRTCClient | null = null;

/**
 * Get WebRTC client singleton
 */
export function getWebRTCClient(): WebRTCClient {
    if (!webrtcClientInstance) {
        webrtcClientInstance = new WebRTCClient();
    }
    return webrtcClientInstance;
}
