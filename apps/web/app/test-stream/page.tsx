import { WebRTCStreamPlayer } from '../../src/components/WebRTCStreamPlayer';

/**
 * ❌ DEPRECATED: This route is kept for backward compatibility
 * Use /[locale]/test-stream instead
 * 
 * Uses WebRTC streaming via orchestrator (NO WebSocket for media)
 */
export default function TestStreamPage() {
    return (
        <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
            <WebRTCStreamPlayer
                sessionId="test-session-123"
                orchestratorUrl="/api/orchestrator/v1"
                width={1920}
                height={1080}
                fps={60}
                bitrate={10000}
            />
        </div>
    );
}
