/**
 * WebRTC Client for Orchestrator Service
 * 
 * Centralized client for webrtc-streaming-service
 * Ensures single source of truth for WebRTC session management
 */

const WEBRTC_SERVICE_URL = process.env.WEBRTC_SERVICE_URL || 'http://20.31.130.73:3015';

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

        console.log('[WebRTCClient] Starting session:', sessionId);

        const response = await fetch(`${this.serviceUrl}/webrtc/session/${sessionId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ width, height, fps, bitrate }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`WebRTC service error (${response.status}): ${error}`);
        }

        const data: any = await response.json();
        console.log('[WebRTCClient] ✅ Session started, offer received');

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
