
import { StreamInput, defaultStreamInputConfig } from "./input";
import { createSupportedVideoFormatsBits } from "./video";

export interface StreamSettings {
    videoSize: "720p" | "1080p" | "1440p" | "4k" | "custom" | "native";
    videoSizeCustom?: { width: number; height: number };
    fps: number;
    bitrate: number;
    packetSize: number;
    videoSampleQueueSize: number;
    playAudioLocal: boolean;
    audioSampleQueueSize: number;
    mouseScrollMode: string;
    controllerConfig: any;
}

export function getStreamerSize(settings: StreamSettings, viewerScreenSize: [number, number]): [number, number] {
    let width, height;
    if (settings.videoSize === "720p") {
        width = 1280;
        height = 720;
    } else if (settings.videoSize === "1080p") {
        width = 1920;
        height = 1080;
    } else if (settings.videoSize === "1440p") {
        width = 2560;
        height = 1440;
    } else if (settings.videoSize === "4k") {
        width = 3840;
        height = 2160;
    } else if (settings.videoSize === "custom" && settings.videoSizeCustom) {
        width = settings.videoSizeCustom.width;
        height = settings.videoSizeCustom.height;
    } else { // native
        width = viewerScreenSize[0];
        height = viewerScreenSize[1];
    }
    return [width, height];
}

export class MoonlightSession {
    private eventTarget = new EventTarget();
    private mediaStream = new MediaStream();
    private peer: RTCPeerConnection | null = null;
    private remoteDescription: RTCSessionDescriptionInit | null = null;
    private iceCandidateQueue: RTCIceCandidateInit[] = [];
    private wsSendBuffer: string[] = [];

    private host: string;
    private port: number;
    private appId: string;
    private settings: StreamSettings;
    private streamerSize: [number, number];
    private ws: WebSocket | null = null;
    private input: StreamInput;

    constructor(host: string, port: number, appId: string, useHttps: boolean, settings: StreamSettings, supportedVideoFormats: any, viewerScreenSize: [number, number]) {
        this.host = host;
        this.port = port;
        this.appId = appId;
        this.settings = settings;
        this.streamerSize = getStreamerSize(settings, viewerScreenSize);

        // Configure web socket
        // Sunshine typically uses port 47989 for HTTP/WebSocket if not using the specific Moonlight Web protocol
        // However, standard Moonlight Web uses /host/stream on the web server port.
        // Since we are connecting to Sunshine directly, we might need to adjust.
        // For now, we assume the orchestrator gave us the correct port (likely 47984 or similar).
        // If this fails, we might need to proxy through the orchestrator.

        // Construct WebSocket URL. 
        // Note: Sunshine's WebSocket implementation for Moonlight might differ.
        // Assuming we are talking to a service that implements the Moonlight Web signaling protocol.
        const protocol = useHttps ? 'wss:' : 'ws:';
        // Use the port provided by the session info.
        this.ws = new WebSocket(`${protocol}//${this.host}:${this.port}/host/stream`);

        this.ws.addEventListener("error", this.onError.bind(this));
        this.ws.addEventListener("open", () => this.onWsOpen(supportedVideoFormats));
        this.ws.addEventListener("close", this.onWsClose.bind(this));
        this.ws.addEventListener("message", this.onRawWsMessage.bind(this));

        // Stream Input
        const streamInputConfig = defaultStreamInputConfig();
        Object.assign(streamInputConfig, {
            mouseScrollMode: this.settings.mouseScrollMode,
            controllerConfig: this.settings.controllerConfig
        });
        this.input = new StreamInput(streamInputConfig);
    }

    private onWsOpen(supportedVideoFormats: any) {
        this.debugLog(`Web Socket Open`);

        // Send AuthenticateAndInit
        // We might need to adjust 'credentials' if Sunshine requires pairing.
        // For now, sending empty credentials or a token if we had one.
        const fps = this.settings.fps;
        this.sendWsMessage({
            AuthenticateAndInit: {
                credentials: "test", // Placeholder
                host_id: "strike-client",
                app_id: this.appId,
                bitrate: this.settings.bitrate,
                packet_size: this.settings.packetSize,
                fps,
                width: this.streamerSize[0],
                height: this.streamerSize[1],
                video_sample_queue_size: this.settings.videoSampleQueueSize,
                play_audio_local: this.settings.playAudioLocal,
                audio_sample_queue_size: this.settings.audioSampleQueueSize,
                video_supported_formats: createSupportedVideoFormatsBits(supportedVideoFormats),
                video_colorspace: "Rec709",
                video_color_range_full: true,
            }
        });

        for (const raw of this.wsSendBuffer.splice(0)) {
            this.ws?.send(raw);
        }
    }

    private debugLog(message: string) {
        console.log(`[MoonlightSession] ${message}`);
        const event = new CustomEvent("stream-info", {
            detail: { type: "addDebugLine", line: message }
        });
        this.eventTarget.dispatchEvent(event);
    }

    private async createPeer(configuration: RTCConfiguration) {
        this.debugLog(`Creating Client Peer`);
        if (this.peer) {
            this.debugLog(`Cannot create Peer because a Peer already exists`);
            return;
        }

        this.peer = new RTCPeerConnection(configuration);
        this.peer.addEventListener("error", (e) => this.onError(e));
        this.peer.addEventListener("negotiationneeded", this.onNegotiationNeeded.bind(this));
        this.peer.addEventListener("icecandidate", this.onIceCandidate.bind(this));
        this.peer.addEventListener("track", this.onTrack.bind(this));
        this.peer.addEventListener("datachannel", this.onDataChannel.bind(this));
        this.peer.addEventListener("connectionstatechange", this.onConnectionStateChange.bind(this));
        this.peer.addEventListener("iceconnectionstatechange", this.onIceConnectionStateChange.bind(this));

        this.input.setPeer(this.peer);

        if (this.remoteDescription) {
            await this.handleRemoteDescription(this.remoteDescription);
        } else {
            await this.onNegotiationNeeded();
        }
        await this.tryDequeueIceCandidates();
    }

    private async onMessage(message: any) {
        if (typeof message === "string") {
            this.dispatchEvent("error", message);
        } else if ("StageStarting" in message) {
            this.dispatchEvent("stageStarting", message.StageStarting.stage);
        } else if ("StageComplete" in message) {
            this.dispatchEvent("stageComplete", message.StageComplete.stage);
        } else if ("StageFailed" in message) {
            this.dispatchEvent("stageFailed", message.StageFailed.stage, message.StageFailed.error_code);
        } else if ("ConnectionTerminated" in message) {
            this.dispatchEvent("connectionTerminated", message.ConnectionTerminated.error_code);
        } else if ("ConnectionStatusUpdate" in message) {
            this.dispatchEvent("connectionStatus", message.ConnectionStatusUpdate.status);
        } else if ("UpdateApp" in message) {
            this.dispatchEvent("app", message.UpdateApp.app);
        } else if ("ConnectionComplete" in message) {
            const capabilities = message.ConnectionComplete.capabilities;
            const width = message.ConnectionComplete.width;
            const height = message.ConnectionComplete.height;
            this.dispatchEvent("connectionComplete", capabilities);
            this.input.onStreamStart(capabilities, [width, height]);
        } else if ("WebRtcConfig" in message) {
            const iceServers = message.WebRtcConfig.ice_servers;
            this.createPeer({ iceServers });
            this.debugLog(`Using WebRTC Ice Servers: ${JSON.stringify(iceServers)}`);
        } else if ("Signaling" in message) {
            if ("Description" in message.Signaling) {
                const descriptionRaw = message.Signaling.Description;
                const description: RTCSessionDescriptionInit = {
                    type: descriptionRaw.ty,
                    sdp: descriptionRaw.sdp,
                };
                await this.handleRemoteDescription(description);
            } else if ("AddIceCandidate" in message.Signaling) {
                const candidateRaw = message.Signaling.AddIceCandidate;
                const candidate: RTCIceCandidateInit = {
                    candidate: candidateRaw.candidate,
                    sdpMid: candidateRaw.sdp_mid,
                    sdpMLineIndex: candidateRaw.sdp_mline_index,
                    usernameFragment: candidateRaw.username_fragment
                };
                await this.handleIceCandidate(candidate);
            }
        }
    }

    private dispatchEvent(type: string, ...args: any[]) {
        const event = new CustomEvent("stream-info", {
            detail: { type, args }
        });
        this.eventTarget.dispatchEvent(event);
    }

    private async onNegotiationNeeded() {
        if (!this.peer) return;
        // await this.peer.setLocalDescription(); // Some browsers might need createOffer first
        // const offer = await this.peer.createOffer();
        // await this.peer.setLocalDescription(offer);
        // this.sendLocalDescription();

        // Moonlight Web implementation just calls setLocalDescription() which creates an offer implicitly if none exists?
        // Actually, standard WebRTC requires createOffer -> setLocalDescription.
        // But the original code did: await this.peer.setLocalDescription();
        // This works in modern browsers (Perfect Negotiation).
        try {
            await this.peer.setLocalDescription();
            this.sendLocalDescription();
        } catch (e) {
            console.error("Negotiation failed", e);
        }
    }

    private async handleRemoteDescription(description: RTCSessionDescriptionInit) {
        this.debugLog(`Received Remote Description of type ${description.type}`);
        this.remoteDescription = description;
        if (!this.peer) {
            this.debugLog(`Saving Remote Description for Peer creation`);
            return;
        }
        await this.peer.setRemoteDescription(description);
        if (description.type === "offer") {
            await this.peer.setLocalDescription();
            this.sendLocalDescription();
        }
        await this.tryDequeueIceCandidates();
    }

    private async tryDequeueIceCandidates() {
        for (const candidate of this.iceCandidateQueue.splice(0)) {
            await this.handleIceCandidate(candidate);
        }
    }

    private async handleIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peer || !this.peer.remoteDescription) {
            this.debugLog(`Received Ice Candidate and queuing it: ${candidate.candidate}`);
            this.iceCandidateQueue.push(candidate);
            return;
        }
        this.debugLog(`Adding Ice Candidate: ${candidate.candidate}`);
        await this.peer.addIceCandidate(candidate);
    }

    private sendLocalDescription() {
        if (!this.peer || !this.peer.localDescription) return;
        const description = this.peer.localDescription;
        this.debugLog(`Sending Local Description of type ${description.type}`);
        this.sendWsMessage({
            Signaling: {
                Description: {
                    ty: description.type,
                    sdp: description.sdp
                }
            }
        });
    }

    private onIceCandidate(event: RTCPeerConnectionIceEvent) {
        if (!event.candidate) return;
        const candidateJson = event.candidate.toJSON();
        this.debugLog(`Sending Ice Candidate: ${candidateJson.candidate}`);
        this.sendWsMessage({
            Signaling: {
                AddIceCandidate: {
                    candidate: candidateJson.candidate,
                    sdp_mid: candidateJson.sdpMid,
                    sdp_mline_index: candidateJson.sdpMLineIndex,
                    username_fragment: candidateJson.usernameFragment
                }
            }
        });
    }

    private onTrack(event: RTCTrackEvent) {
        // @ts-ignore
        event.receiver.jitterBufferTarget = 0;
        // @ts-ignore
        if ("playoutDelayHint" in event.receiver) event.receiver.playoutDelayHint = 0;

        const stream = event.streams[0];
        if (stream) {
            stream.getTracks().forEach(track => {
                this.debugLog(`Adding Media Track ${track.label}`);
                if (track.kind === "video" && "contentHint" in track) {
                    // @ts-ignore
                    track.contentHint = "motion";
                }
                this.mediaStream.addTrack(track);
            });
        }
    }

    private onConnectionStateChange() {
        if (!this.peer) return;
        this.debugLog(`Changing Peer State to ${this.peer.connectionState}`);
        if (["failed", "disconnected", "closed"].includes(this.peer.connectionState)) {
            this.dispatchEvent("error", `Connection state is ${this.peer.connectionState}`);
        }
    }

    private onIceConnectionStateChange() {
        if (!this.peer) return;
        this.debugLog(`Changing Peer Ice State to ${this.peer.iceConnectionState}`);
    }

    private onDataChannel(event: RTCDataChannelEvent) {
        this.debugLog(`Received Data Channel ${event.channel.label}`);
        if (event.channel.label === "general") {
            event.channel.addEventListener("message", this.onGeneralDataChannelMessage.bind(this));
        }
    }

    private async onGeneralDataChannelMessage(event: MessageEvent) {
        const data = event.data;
        if (typeof data !== "string") return;
        try {
            let message = JSON.parse(data);
            await this.onMessage(message);
        } catch (e) {
            console.error("Failed to parse general channel message", e);
        }
    }

    private onWsClose() {
        this.debugLog(`Web Socket Closed`);
    }

    private sendWsMessage(message: any) {
        const raw = JSON.stringify(message);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(raw);
        } else {
            this.wsSendBuffer.push(raw);
        }
    }

    private async onRawWsMessage(event: MessageEvent) {
        const data = event.data;
        if (typeof data !== "string") return;
        try {
            let message = JSON.parse(data);
            await this.onMessage(message);
        } catch (e) {
            console.error("Failed to parse WS message", e);
        }
    }

    private onError(event: Event) {
        this.debugLog(`Web Socket or WebRtcPeer Error`);
        console.error("Stream Error", event);
    }

    // Public API
    addInfoListener(listener: EventListenerOrEventListenerObject) {
        this.eventTarget.addEventListener("stream-info", listener);
    }

    removeInfoListener(listener: EventListenerOrEventListenerObject) {
        this.eventTarget.removeEventListener("stream-info", listener);
    }

    getMediaStream() {
        return this.mediaStream;
    }

    getInput() {
        return this.input;
    }

    close() {
        this.ws?.close();
        this.peer?.close();
        this.input.setPeer(null as any);
        this.mediaStream.getTracks().forEach(t => t.stop());
    }
}
