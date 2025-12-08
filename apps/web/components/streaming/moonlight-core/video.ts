
import { StreamSupportedVideoFormats } from "./api-bindings";

interface VideoCodecCapability {
    key: string;
    mimeType: string;
    fmtpLine: string[];
    sdpFmtpLine?: string;
}

interface VideoDecoderCodec {
    key: string;
    codec: string;
    colorSpace?: {
        primaries: string;
        matrix: string;
        transfer: string;
        fullRange: boolean;
    };
}

const CAPABILITIES_CODECS: VideoCodecCapability[] = [
    // H264
    { key: "H264", mimeType: "video/H264", fmtpLine: ["packetization-mode=1", "profile-level-id=42e01f"] },
    { key: "H264_HIGH8_444", mimeType: "video/H264", fmtpLine: ["packetization-mode=1", "profile-level-id=640032"] },
    // H265
    { key: "H265", mimeType: "video/H265", fmtpLine: [] },
    { key: "H265_MAIN10", mimeType: "video/H265", fmtpLine: ["profile-id=2", "tier-flag=0", "tx-mode=SRST"] },
    { key: "H265_REXT8_444", mimeType: "video/H265", fmtpLine: ["profile-id=4", "tier-flag=0", "tx-mode=SRST"] },
    { key: "H265_REXT10_444", mimeType: "video/H265", fmtpLine: ["profile-id=5", "tier-flag=0", "tx-mode=SRST"] },
    // Av1
    { key: "AV1_MAIN8", mimeType: "video/AV1", fmtpLine: [] },
    { key: "AV1_MAIN10", mimeType: "video/AV1", fmtpLine: [] },
    { key: "AV1_HIGH8", mimeType: "video/AV1", fmtpLine: ["profile=1"] },
    { key: "AV1_HIGH10", mimeType: "video/AV1", fmtpLine: ["profile=1"] },
];

const VIDEO_DECODER_CODECS: VideoDecoderCodec[] = [
    { key: "H264_HIGH8_444", codec: "avc1.4d400c", colorSpace: { primaries: "bt709", matrix: "bt709", transfer: "bt709", fullRange: true } },
];

export function getStandardVideoFormats(): Record<string, boolean> {
    return {
        H264: true, // assumed universal
        H264_HIGH8_444: false,
        H265: false,
        H265_MAIN10: false,
        H265_REXT8_444: false,
        H265_REXT10_444: false,
        AV1_MAIN8: false,
        AV1_MAIN10: false,
        AV1_HIGH8_444: false,
        AV1_HIGH10_444: false
    };
}

export async function getSupportedVideoFormats(): Promise<Record<string, boolean>> {
    let support = getStandardVideoFormats();

    // Check WebRTC capabilities
    if ("RTCRtpReceiver" in window && "getCapabilities" in RTCRtpReceiver && typeof RTCRtpReceiver.getCapabilities === "function") {
        const capabilities = RTCRtpReceiver.getCapabilities("video");
        if (capabilities) {
            for (const capCodec of capabilities.codecs) {
                for (const codec of CAPABILITIES_CODECS) {
                    let compatible = true;
                    if (capCodec.mimeType.toLowerCase() !== codec.mimeType.toLowerCase()) {
                        compatible = false;
                    }
                    for (const fmtpLineAttrib of codec.fmtpLine) {
                        if (!capCodec.sdpFmtpLine?.includes(fmtpLineAttrib)) {
                            compatible = false;
                        }
                    }
                    if (compatible) {
                        support[codec.key] = true;
                    }
                }
            }
        }
    } else if ("VideoDecoder" in window && window.isSecureContext) {
        for (const codec of VIDEO_DECODER_CODECS) {
            try {
                // @ts-ignore - VideoDecoder types might be missing
                const result = await VideoDecoder.isConfigSupported(codec);
                support[codec.key] = result.supported || support[codec.key];
            } catch (e) {
                support[codec.key] = false;
            }
        }
    } else if ("MediaSource" in window) {
        for (const codec of VIDEO_DECODER_CODECS) {
            const supported = MediaSource.isTypeSupported(`video/mp4; codecs="${codec.codec}"`);
            support[codec.key] = supported || support[codec.key];
        }
    } else {
        const mediaElement = document.createElement("video");
        for (const codec of VIDEO_DECODER_CODECS) {
            const supported = mediaElement.canPlayType(`video/mp4; codecs="${codec.codec}"`);
            support[codec.key] = supported === "probably" || support[codec.key];
        }
    }
    return support;
}

export function createSupportedVideoFormatsBits(support: Record<string, boolean>): number {
    let mask = 0;
    if (support.H264) mask |= StreamSupportedVideoFormats.H264;
    if (support.H264_HIGH8_444) mask |= StreamSupportedVideoFormats.H264_HIGH8_444;
    if (support.H265) mask |= StreamSupportedVideoFormats.H265;
    if (support.H265_MAIN10) mask |= StreamSupportedVideoFormats.H265_MAIN10;
    if (support.H265_REXT8_444) mask |= StreamSupportedVideoFormats.H265_REXT8_444;
    if (support.H265_REXT10_444) mask |= StreamSupportedVideoFormats.H265_REXT10_444;
    if (support.AV1_MAIN8) mask |= StreamSupportedVideoFormats.AV1_MAIN8;
    if (support.AV1_MAIN10) mask |= StreamSupportedVideoFormats.AV1_MAIN10;
    if (support.AV1_HIGH8_444) mask |= StreamSupportedVideoFormats.AV1_HIGH8_444;
    if (support.AV1_HIGH10_444) mask |= StreamSupportedVideoFormats.AV1_HIGH10_444;
    return mask;
}
