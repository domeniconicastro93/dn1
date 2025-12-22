const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'webrtc-peer.ts');
console.log('Patching:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"]\.\/(capture-provider|capture-provider\.js)['"]\s*;?/g, "const nativeCapture = require('../native/build/Release/native_capture.node');");

const lines = content.split('\n');
const filteredLines = lines.filter(line => !line.match(/private\s+captureProvider\s*:/));
content = filteredLines.join('\n');

function replaceMethodBody(text, methodName, newBody) {
  const methodPattern = new RegExp(`(private\\s+(async\\s+)?${methodName}\\s*\\([^)]*\\)\\s*:\\s*\\w+\\s*)\\{`);
  const match = text.match(methodPattern);
  if (!match) { console.error(`Method ${methodName} not found`); return text; }
  const startIndex = text.indexOf(match[0]);
  const openBraceIndex = startIndex + match[0].length - 1;
  let braceCount = 1;
  let endIndex = openBraceIndex + 1;
  while (braceCount > 0 && endIndex < text.length) {
    if (text[endIndex] === '{') braceCount++;
    if (text[endIndex] === '}') braceCount--;
    endIndex++;
  }
  const before = text.substring(0, openBraceIndex);
  const after = text.substring(endIndex);
  return before + newBody + after;
}

const startCaptureBody = ` {
        console.log(\`[WebRTCPeer][\${this.sessionId}] ?? Starting WGC/DXGI native capture\`);
        nativeCapture.start({
            width: this.streamConfig.width,
            height: this.streamConfig.height,
            fps: this.streamConfig.fps,
            bitrate: this.streamConfig.bitrate ?? 5000,
            useHardwareEncoder: false
        }, (nalBuffer) => {
            this.processH264Data(nalBuffer);
        });
        console.log(\`[WebRTCPeer][\${this.sessionId}] ? Native capture started\`);
    }`;

const stopCaptureBody = ` {
        if (nativeCapture?.stop) nativeCapture.stop();
        this.h264Parser.clear();
        console.log(\`[WebRTCPeer][\${this.sessionId}] ?? Native capture stopped\`);
    }`;

content = replaceMethodBody(content, 'startCapture', startCaptureBody);
content = replaceMethodBody(content, 'stopCapture', stopCaptureBody);

console.log('\nVerification:');
console.log('- Contains native_capture.node:', content.includes('native_capture.node'));
console.log('- Contains capture-provider:', content.includes('capture-provider'));
console.log('- Contains ffmpeg:', content.toLowerCase().includes('ffmpeg'));
console.log('- Contains gdigrab:', content.toLowerCase().includes('gdigrab'));

if (!content.includes('native_capture.node')) throw new Error('Patch failed: native_capture.node not found');
if (content.includes('capture-provider')) throw new Error('Patch failed: capture-provider still present');
if (content.toLowerCase().includes('ffmpeg') || content.toLowerCase().includes('gdigrab')) throw new Error('Patch failed: ffmpeg/gdigrab still present');

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n? Patch applied successfully!');
