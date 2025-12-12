import { WebRTCStreamPlayer } from '../../../src/components/WebRTCStreamPlayer';

/**
 * Strike WebRTC Test Page
 * 
 * This page demonstrates the REAL WebRTC streaming implementation:
 * - Media flows over RTP/SRTP via RTCPeerConnection
 * - Signaling via HTTP/fetch to orchestrator
 * - NO WebSocket for media transport
 * - NO direct calls to webrtc-streaming-service
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
