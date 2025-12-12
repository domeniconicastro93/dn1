import { RTCPeerConnection, MediaStreamTrack } from 'werift';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * WebRTC Peer for Strike Cloud Gaming (using werift - pure JavaScript WebRTC)
 * 
 * FIXED: Adds video transceiver BEFORE createOffer() to generate proper BUNDLE group
 */

export interface StreamConfig {
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    preset?: string;
}

export class WebRTCPeer extends EventEmitter {
    private peerConnection: RTCPeerConnection;
    private streamConfig: StreamConfig;
    private ffmpegProcess: ChildProcess | null = null;
    private sessionId: string;
    private videoTrack: MediaStreamTrack | null = null;

    constructor(sessionId: string, streamConfig: StreamConfig) {
        super();
        this.sessionId = sessionId;
        this.streamConfig = streamConfig;

        // Create RTCPeerConnection with max-bundle policy
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            bundlePolicy: 'max-bundle',
        });

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event: any) => {
            if (event.candidate) {
                console.log('[WebRTCPeer] ICE candidate:', event.candidate);
                this.emit('icecandidate', event.candidate);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[WebRTCPeer] Connection state:', this.peerConnection.connectionState);
            this.emit('connectionstatechange', this.peerConnection.connectionState);

            if (this.peerConnection.connectionState === 'connected') {
                console.log('[WebRTCPeer] ✅ WebRTC connection established!');
                // Start capture when connected
                this.startCapture();
            }
        };

        // Handle ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('[WebRTCPeer] ICE connection state:', this.peerConnection.iceConnectionState);
        };

        console.log('[WebRTCPeer] Initialized for session:', sessionId, streamConfig);
    }

    /**
     * Create WebRTC offer
     * 
     * ✅ FIX: Create and add video track BEFORE calling createOffer()
     * This ensures the SDP contains proper BUNDLE group
     */
    async createOffer(): Promise<any> {
        console.log('[WebRTCPeer] Creating video track...');

        // ✅ CRITICAL FIX: Create video track BEFORE createOffer()
        // This ensures werift generates SDP with BUNDLE group
        this.videoTrack = new MediaStreamTrack({ kind: 'video' });

        // ✅ Add transceiver with sendonly direction
        const transceiver = this.peerConnection.addTransceiver(this.videoTrack, {
            direction: 'sendonly'
        });

        console.log('[WebRTCPeer] Video transceiver added:', transceiver.mid);

        // Now create offer - SDP will include BUNDLE group
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        console.log('[WebRTCPeer] ✅ Created offer with BUNDLE group');
        console.log('[WebRTCPeer] SDP:', offer.sdp?.substring(0, 200) + '...');

        return offer;
    }

    /**
     * Handle WebRTC answer from client
     */
    async handleAnswer(answer: any): Promise<void> {
        await this.peerConnection.setRemoteDescription(answer);
        console.log('[WebRTCPeer] Set remote description (answer)');
    }

    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate: any): Promise<void> {
        await this.peerConnection.addIceCandidate(candidate);
        console.log('[WebRTCPeer] Added ICE candidate');
    }

    /**
     * Start capturing desktop with FFmpeg
     * 
     * NOTE: This starts after WebRTC connection is established
     */
    private startCapture(): void {
        console.log('[WebRTCPeer] Starting desktop capture...');

        const { width, height, fps, bitrate, preset = 'ultrafast' } = this.streamConfig;

        // FFmpeg command optimized for low-latency gaming
        this.ffmpegProcess = spawn('ffmpeg', [
            // Input: Desktop capture
            '-f', 'gdigrab',
            '-framerate', fps.toString(),
            '-video_size', `${width}x${height}`,
            '-i', 'desktop',

            // Encoding: H.264 with ultra-low latency
            '-vcodec', 'libx264',
            '-preset', preset,
            '-tune', 'zerolatency',
            '-g', (fps * 2).toString(),
            '-keyint_min', fps.toString(),
            '-sc_threshold', '0',
            '-b:v', `${bitrate}k`,
            '-maxrate', `${bitrate}k`,
            '-bufsize', `${bitrate * 2}k`,
            '-pix_fmt', 'yuv420p',

            // Output: H.264 Annex B
            '-f', 'h264',
            '-'
        ]);

        // Process H.264 data
        this.ffmpegProcess.stdout?.on('data', (chunk: Buffer) => {
            // TODO: Feed to video track
            // For now, just log that we're receiving data
            if (chunk.length > 0 && this.videoTrack) {
                // werift video track integration would go here
                // This requires additional werift API usage
            }
        });

        // Log FFmpeg errors
        this.ffmpegProcess.stderr?.on('data', (data: Buffer) => {
            const log = data.toString();
            if (log.includes('error') || log.includes('Error')) {
                console.error('[FFmpeg]', log);
            }
        });

        // Handle FFmpeg exit
        this.ffmpegProcess.on('close', (code) => {
            console.log('[WebRTCPeer] FFmpeg process closed with code:', code);
        });

        console.log('[WebRTCPeer] ✅ Desktop capture started');
    }

    /**
     * Stop capture and close connection
     */
    close(): void {
        console.log('[WebRTCPeer] Closing session:', this.sessionId);

        if (this.ffmpegProcess) {
            this.ffmpegProcess.kill('SIGTERM');
            this.ffmpegProcess = null;
        }

        this.peerConnection.close();
        console.log('[WebRTCPeer] Closed');
    }

    /**
     * Get connection state
     */
    getState(): string {
        return this.peerConnection.connectionState;
    }
}
