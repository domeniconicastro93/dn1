const fs = require('fs');
const filePath = 'C:/Strike/strike-gaming/services/webrtc-streaming-service/src/webrtc-peer.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace imports
content = content.replace(
  "import { spawn, ChildProcess } from 'child_process';",
  "const nativeCapture = require('../../native_capture.node');"
);

// Remove ffmpegProcess field
content = content.replace(/private ffmpegProcess.*\n/g, '');

//Replace FFmpeg with Native
content = content.replace(/FFmpeg/g, 'Native');

// Replace startCapture method  
const newStartCapture =     private startCapture(): void {
        console.log(\[WebRTCPeer][\] Starting native capture\);
        nativeCapture.start({
            width: this.streamConfig.width,
            height: this.streamConfig.height,
            fps: this.streamConfig.fps,
            bitrate: this.streamConfig.bitrate ?? 5000,
            useHardwareEncoder: false
        }, (nalBuffer) => {
            this.processH264Data(nalBuffer);
        });
        console.log(\[WebRTCPeer][\] Native capture started\);
    };
    
content = content.replace(/private startCapture\(\): void \{[\s\S]*?^\s{4}\}/m, newStartCapture);

// Replace stopCapture method
const newStopCapture =     private stopCapture(): void {
        if (nativeCapture?.stop) nativeCapture.stop();
        this.h264Parser.clear();
        console.log(\[WebRTCPeer][\] Native capture stopped\);
    };
    
content = content.replace(/private stopCapture\(\): void \{[\s\S]*?^\s{4}\}/m, newStopCapture);

fs.writeFileSync(filePath, content, 'utf8');
console.log('PATCH_OK');
