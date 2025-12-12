// Type definitions for wrtc
declare module 'wrtc' {
    export class RTCPeerConnection {
        constructor(configuration?: RTCConfiguration);

        onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
        onconnectionstatechange: (() => void) | null;
        oniceconnectionstatechange: (() => void) | null;
        ontrack: ((event: RTCTrackEvent) => void) | null;

        connectionState: RTCPeerConnectionState;
        iceConnectionState: RTCIceConnectionState;

        createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
        createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
        setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
        setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
        addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
        addTrack(track: any): void;
        close(): void;
    }

    export class RTCSessionDescription {
        constructor(descriptionInitDict: RTCSessionDescriptionInit);
        type: RTCSdpType;
        sdp: string;
    }

    export class RTCIceCandidate {
        constructor(candidateInitDict: RTCIceCandidateInit);
        candidate: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
    }

    export namespace nonstandard {
        export class RTCVideoSource {
            createTrack(): any;
            onFrame(frame: { width: number; height: number; data: Uint8ClampedArray }): void;
        }

        export class RTCAudioSource {
            createTrack(): any;
        }
    }

    export interface RTCConfiguration {
        iceServers?: RTCIceServer[];
        bundlePolicy?: RTCBundlePolicy;
        rtcpMuxPolicy?: RTCRtcpMuxPolicy;
    }

    export interface RTCIceServer {
        urls: string | string[];
        username?: string;
        credential?: string;
    }

    export type RTCBundlePolicy = 'balanced' | 'max-compat' | 'max-bundle';
    export type RTCRtcpMuxPolicy = 'negotiate' | 'require';
    export type RTCPeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
    export type RTCIceConnectionState = 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
    export type RTCSdpType = 'offer' | 'pranswer' | 'answer' | 'rollback';

    export interface RTCSessionDescriptionInit {
        type: RTCSdpType;
        sdp?: string;
    }

    export interface RTCIceCandidateInit {
        candidate?: string;
        sdpMid?: string | null;
        sdpMLineIndex?: number | null;
    }

    export interface RTCOfferOptions {
        offerToReceiveAudio?: boolean;
        offerToReceiveVideo?: boolean;
    }

    export interface RTCAnswerOptions { }

    export interface RTCPeerConnectionIceEvent {
        candidate: RTCIceCandidate | null;
    }

    export interface RTCTrackEvent {
        track: any;
        streams: any[];
    }
}
