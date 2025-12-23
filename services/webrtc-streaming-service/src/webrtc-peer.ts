import { RTCPeerConnection, MediaStreamTrack, RTCRtpSender, RtpPacket, RtpHeader, RTCRtpCodecParameters } from 'werift';
const nativeCapture = require('../native/build/Release/native_capture.node');
import { EventEmitter } from 'events';
import { H264Parser, NALUnit } from './h264-parser';
import { RTPPacketizer } from './rtp-packetizer';

/**
 * WebRTC Peer for Strike Cloud Gaming - COMPLETE IMPLEMENTATION
 * 
 * Native → H.264 → NAL Units → RTP Packets → WebRTC
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
    private sessionId: string;
    private videoTrack: MediaStreamTrack | null = null;
    private h264Parser: H264Parser;
    private rtpPacketizer: RTPPacketizer;
    private rtpSender: RTCRtpSender | null = null;
    private frameCount: number = 0;
    private canSendRtp: boolean = false;
    private _rtpOnce = new Set<string>();
    private _rtpOnceLog(msg: string) { if (this._rtpOnce.has(msg)) return; this._rtpOnce.add(msg); console.log("[RTP-TRACE]", msg); }
    
    // REQUIRED FOR CHROME WEBRTC DECODER: Cache parameter sets for IDR re-injection
    private cachedSPS: NALUnit | null = null;
    private cachedPPS: NALUnit | null = null;

    constructor(sessionId: string, streamConfig: StreamConfig) {
        super();
        this.sessionId = sessionId;
        this.streamConfig = streamConfig;
        this.h264Parser = new H264Parser();
        this.rtpPacketizer = new RTPPacketizer(streamConfig.fps);

        // Create RTCPeerConnection with H.264 support
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            bundlePolicy: 'max-bundle',
            // @ts-ignore - werift supports codecs in config but type definition might be missing
            codecs: {
                video: [
                    new RTCRtpCodecParameters({
                        mimeType: "video/H264",
                        clockRate: 90000,
                        payloadType: 96,
                        rtcpFeedback: [
                            { type: "nack" },
                            { type: "nack", parameter: "pli" },
                            { type: "goog-remb" }
                        ],
                        parameters: "packetization-mode=1;profile-level-id=42e01f;level-asymmetry-allowed=1"
                    })
                ]
            }
        });

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event: any) => {
            if (event.candidate) {
                this.emit('icecandidate', event.candidate);
            }
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.log(`[WebRTCPeer][${sessionId}] Connection state:`, state);
            this.emit('connectionstatechange', state);

            if (state === 'connected') {
                this.canSendRtp = true;
                console.log(`[WebRTCPeer][${sessionId}] ✅ WebRTC connected! canSendRtp=true`);
                this._rtpOnceLog("CONNECTED: canSendRtp=true");
                this.startCapture();
            }

            if (state === 'failed' || state === 'closed' || state === 'disconnected') {
                this.canSendRtp = false;
                this.stopCapture();
            }
        };

        console.log(`[WebRTCPeer][${sessionId}] Initialized:`, streamConfig);
    }

    /**
     * Create WebRTC offer
     */
    async createOffer(): Promise<any> {
        console.log(`[WebRTCPeer][${this.sessionId}] Creating video track...`);

        // Create video track
        this.videoTrack = new MediaStreamTrack({ kind: 'video' });

        // Add transceiver
        const transceiver = this.peerConnection.addTransceiver(this.videoTrack, {
            direction: 'sendonly'
        });

        // Store RTP sender for later use
        this.rtpSender = transceiver.sender;

        console.log(`[WebRTCPeer][${this.sessionId}] Video transceiver added`);

        // Create offer
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        console.log(`[WebRTCPeer][${this.sessionId}] ✅ Offer created`);

        return offer;
    }

    /**
     * Handle WebRTC answer
     */
    async handleAnswer(answer: any): Promise<void> {
        await this.peerConnection.setRemoteDescription(answer);
        console.log(`[WebRTCPeer][${this.sessionId}] ✅ Answer set`);

        // 🔥 FIX: Start capture immediately after answer is set
        // Don't wait for connectionState=connected (chicken-and-egg problem)
        console.log(`[WebRTCPeer][${this.sessionId}] Starting capture immediately...`);
        this.startCapture();
    }

    /**
     * Add ICE candidate
     */
    async addIceCandidate(candidate: any): Promise<void> {
        await this.peerConnection.addIceCandidate(candidate);
    }

    /**
     * Start Native desktop capture
     */
    private startCapture(): void {
        console.log(`[WebRTCPeer][${this.sessionId}] Starting native capture`);
        nativeCapture.start({
            width: this.streamConfig.width,
            height: this.streamConfig.height,
            fps: this.streamConfig.fps,
            bitrate: this.streamConfig.bitrate ?? 5000,
            useHardwareEncoder: false
        }, (nalBuffer: Buffer) => {
            this.processH264Data(nalBuffer);
        });
        console.log(`[WebRTCPeer][${this.sessionId}] Native capture started`);
    }

    /**
     * Process H.264 data from Native
     */
    private processH264Data(data: Buffer): void {
        // Add to H.264 parser
        this.h264Parser.addData(data);

        // Extract NAL units
        const nalUnits = this.h264Parser.extractNALUnits();

        // Process each NAL unit
        for (const nalUnit of nalUnits) {
            this.processNALUnit(nalUnit);
        }
    }

    /**
     * Process single NAL unit
     */
    private processNALUnit(nalUnit: NALUnit): void {
        this.frameCount++;

        // Log first few frames and keyframes
        if (this.frameCount <= 5 || nalUnit.isKeyframe) {
            const nalTypeName = H264Parser.getNALTypeName(nalUnit.type);
            console.log(`[WebRTCPeer][${this.sessionId}] Frame ${this.frameCount}: ${nalTypeName} (${nalUnit.data.length} bytes)`);
        }

        // REQUIRED FOR CHROME WEBRTC DECODER: Cache SPS and PPS for re-injection
        if (nalUnit.type === 7) {
            this.cachedSPS = nalUnit;
        } else if (nalUnit.type === 8) {
            this.cachedPPS = nalUnit;
        }

        // REQUIRED FOR CHROME WEBRTC DECODER: Re-inject SPS+PPS before EVERY IDR
        // Chrome requires parameter sets before each keyframe with same timestamp
        if (nalUnit.type === 5 && this.cachedSPS && this.cachedPPS) {
            // Get IDR timestamp before packetizing
            const idrTimestamp = this.rtpPacketizer.getTimestamp();
            
            // Send SPS with marker=false, same timestamp as IDR
            const spsPackets = this.rtpPacketizer.packetize(this.cachedSPS);
            for (const pkt of spsPackets) {
                pkt.marker = false; // Never mark SPS
                pkt.timestamp = idrTimestamp;
                this.sendRTPPacket(pkt);
            }
            
            // Send PPS with marker=false, same timestamp as IDR
            const ppsPackets = this.rtpPacketizer.packetize(this.cachedPPS);
            for (const pkt of ppsPackets) {
                pkt.marker = false; // Never mark PPS
                pkt.timestamp = idrTimestamp;
                this.sendRTPPacket(pkt);
            }
        }

        // Packetize and send current NAL unit (IDR will have marker=true)
        const rtpPackets = this.rtpPacketizer.packetize(nalUnit);
        if (rtpPackets.length === 0) {
            console.warn(`[WebRTCPeer][${this.sessionId}] WARNING: Packetizer returned 0 packets for NAL type ${nalUnit.type}`);
            return;
        }

        for (const rtpPacket of rtpPackets) {
            this.sendRTPPacket(rtpPacket);
        }
    }

    /**
     * Send RTP packet via WebRTC
     */
    private negotiatedPayloadType: number | null = null;
    private ssrc: number | null = null;

    private getNegotiatedPayloadType(): number {
        if (this.negotiatedPayloadType) return this.negotiatedPayloadType;

        const remoteDesc = this.peerConnection.remoteDescription;
        if (remoteDesc && remoteDesc.sdp) {
            const match = remoteDesc.sdp.match(/a=rtpmap:(\d+) H264\/90000/i);
            if (match) {
                this.negotiatedPayloadType = parseInt(match[1], 10);
                return this.negotiatedPayloadType;
            }
        }
        return 96; // Fallback
    }

    private sendRTPPacket(packet: any): void {
        if (!this.rtpSender || !this.videoTrack || !this.canSendRtp) return;

        try {
            const track = this.videoTrack as any;

            // Resolve SSRC once
            if (!this.ssrc) {
                // @ts-ignore
                this.ssrc = track.ssrc || (this.rtpSender ? (this.rtpSender as any).ssrc : null);

                // One-time verification log
                if (this.ssrc) {
                    const negotiatedPT = this.getNegotiatedPayloadType();
                    // Intentionally logging hardcoded 96 for header PT as that's what we are currently using before Phase 2 fix
                    console.log(`[VERIFY][${this.sessionId}] negotiated_pt=${negotiatedPT} header_pt=96 track_ssrc=${track.ssrc} sender_ssrc=${(this.rtpSender as any).ssrc} header_ssrc=${this.ssrc}`);
                }
            }

            if (!this.ssrc) return;

            const header = new RtpHeader({
                payloadType: 96, // Still hardcoded for Phase 1
                sequenceNumber: this.rtpPacketizer.getSequenceNumber(),
                timestamp: packet.timestamp,
                marker: packet.marker,
                ssrc: this.ssrc
            });

            const rtpPacket = new RtpPacket(header, packet.payload);
            track.writeRtp(rtpPacket);
            this.rtpPacketizer.incrementSequenceNumber();

        } catch (error: any) {
            console.error(`[WebRTCPeer][${this.sessionId}] RTP WRITE ERROR:`, error.message);
        }
    }

    /**
     * Stop capture
     */
    private stopCapture(): void {
        if (nativeCapture?.stop) nativeCapture.stop();
        this.h264Parser.clear();
        console.log(`[WebRTCPeer][${this.sessionId}] Native capture stopped`);
    }

    /**
     * Close peer connection
     */
    close(): void {
        console.log(`[WebRTCPeer][${this.sessionId}] Closing...`);
        this.stopCapture();
        this.peerConnection.close();
    }

    /**
     * Get connection state
     */
    getState(): string {
        return this.peerConnection.connectionState;
    }
}
