/**
 * Capture Provider Interface
 * 
 * Abstraction for Windows Graphics Capture (WGC) and DXGI Desktop Duplication
 */

export interface CaptureFrame {
    data: Buffer;           // H.264 NAL units (Annex B format)
    width: number;
    height: number;
    timestamp: number;      // Milliseconds since capture start
    format: 'h264';         // Only H.264 for now
}

export interface CaptureConfig {
    width: number;
    height: number;
    fps: number;
    bitrate?: number;       // kbps, default 5000
    useHardwareEncoder?: boolean; // AMD AMF if available, default true
}

export interface CaptureProvider {
    start(config: CaptureConfig): Promise<void>;
    stop(): void;
    onFrame(callback: (frame: CaptureFrame) => void): void;
    onError(callback: (error: Error) => void): void;
    isCapturing(): boolean;
}

/**
 * Create native capture provider
 * Loads WGC/DXGI C++ addon
 */
export async function createCaptureProvider(): Promise<CaptureProvider> {
    try {
        const nativeCapture = require('../build/Release/native_capture.node');
        return new nativeCapture.CaptureProvider();
    } catch (error) {
        throw new Error(`Failed to load native capture addon: ${error}`);
    }
}
