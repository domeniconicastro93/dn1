const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'webrtc-peer.ts');
let src = fs.readFileSync(filePath, 'utf8');

function replaceBetween(source, startNeedle, endNeedle, replacement) {
    const start = source.indexOf(startNeedle);
    if (start === -1) throw new Error('start needle not found: ' + startNeedle);
    const end = source.indexOf(endNeedle, start);
    if (end === -1) throw new Error('end needle not found: ' + endNeedle);
    return source.slice(0, start) + replacement + source.slice(end);
}

function replaceMethodBody(source, methodName, newFullMethod) {
    const idx = source.indexOf(methodName + '(');
    if (idx === -1) throw new Error(`Method ${methodName} not found`);
    const braceStart = source.indexOf('{', idx);
    if (braceStart === -1) throw new Error(`No body brace for ${methodName}`);
    let depth = 0;
    let i = braceStart;
    for (; i < source.length; i++) {
        const ch = source[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) { i++; break; }
        }
    }
    if (depth !== 0) throw new Error(`Unbalanced braces in ${methodName}`);
    const lineStart = source.lastIndexOf('\n', idx) + 1;
    const before = source.slice(0, lineStart);
    const after = source.slice(i);
    return before + newFullMethod + '\n' + after;
}

// 1) Ensure werift imports include RtpPacket/RtpHeader
// Replace ONLY the werift import line if present.
src = src.replace(
    /from\s+'werift';/g,
    "from 'werift';"
);

// If there is an import like: import { ... } from 'werift';
src = src.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+'werift';/m,
    (m, inner) => {
        const parts = inner.split(',').map(s => s.trim()).filter(Boolean);
        const need = ['RtpPacket', 'RtpHeader'];
        for (const n of need) if (!parts.includes(n)) parts.push(n);
        return `import { ${parts.join(', ')} } from 'werift';`;
    }
);

// 2) Add canSendRtp field near other fields (inject after sessionId field if exists)
if (!src.includes('canSendRtp')) {
    // try inject after "private sessionId" line
    src = src.replace(
        /(private\s+sessionId[^;]*;\s*\r?\n)/,
        `$1  private canSendRtp: boolean = false;\n`
    );
}

// 3) Gate sending: turn on when connected (find connectionState handler region)
if (!src.includes('this.canSendRtp = true')) {
    // Insert in the place where connectionState is logged/handled.
    // We look for "Connection state:" log and add gating after it.
    src = src.replace(
        /(Connection state:\s*\$\{[^}]+\}[^;]*;\s*\r?\n)/,
        `$1        if (this.peerConnection.connectionState === 'connected') {\n          this.canSendRtp = true;\n          console.log(\`[WebRTCPeer][\${this.sessionId}] ✅ canSendRtp=true (connected)\`);\n        }\n`
    );
}

// 4) Replace sendRTPPacket method body entirely with safe version
const sendMethod = `private sendRTPPacket(packet: any): void {
        if (!this.rtpSender || !this.videoTrack) {
            return;
        }
        
        if (!this.canSendRtp) return;

        const track = this.videoTrack as any;
        if (!track?.ssrc || track.ssrc === 0) {
            throw new Error(\`Invalid SSRC: \${track?.ssrc}\`);
        }

        const header = new RtpHeader({
            payloadType: 96,
            sequenceNumber: this.rtpPacketizer.getSequenceNumber(),
            timestamp: packet.timestamp,
            marker: packet.marker,
            ssrc: track.ssrc
        });

        const rtpPacket = new RtpPacket(header, packet.payload);
        track.writeRtp(rtpPacket);
        this.rtpPacketizer.incrementSequenceNumber();
    }`;

src = replaceMethodBody(src, 'sendRTPPacket', sendMethod);

// Safety assertions
if (src.toLowerCase().includes('ffmpeg') || src.toLowerCase().includes('gdigrab')) {
    throw new Error('FFmpeg/gdigrab reference present');
}
if (!src.includes('RtpPacket') || !src.includes('RtpHeader')) {
    throw new Error('Missing RtpPacket/RtpHeader imports');
}
if (!src.includes('canSendRtp')) {
    throw new Error('Missing canSendRtp field');
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('PATCH_OK');
