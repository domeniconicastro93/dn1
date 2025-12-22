const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'webrtc-peer.ts');
let src = fs.readFileSync(filePath, 'utf8');

// STEP 1: Fix imports - remove capture-provider, add native_capture
const captureProviderImportRegex = /import\s*\{[^}]*\}\s*from\s*['"]\.\/(capture-provider|capture\/provider)['"];?\s*\n?/g;
src = src.replace(captureProviderImportRegex, '');

// Add native_capture require after the last import if not present
if (!src.includes('native_capture.node')) {
  const lastImportIdx = src.lastIndexOf('import ');
  if (lastImportIdx !== -1) {
    const lineEnd = src.indexOf('\n', lastImportIdx);
    const before = src.slice(0, lineEnd + 1);
    const after = src.slice(lineEnd + 1);
    src = before + 'const nativeCapture = require(\'../../native_capture.node\');\n' + after;
  }
}

// Remove CaptureProvider and CaptureFrame type references
src = src.replace(/private\s+captureProvider:\s*CaptureProvider\s*\|\s*null\s*=\s*null;?\s*\n?/g, '');

// Update comments: remove FFmpeg/gdigrab references
src = src.replace(/\/\*\*[\s\S]*?FFmpeg.*?H\.264.*?WebRTC[\s\S]*?\*\//g, '/**\n * WebRTC Peer for Strike Cloud Gaming - Native WGC/DXGI Capture\n *\n * Native Capture → H.264 → NAL Units → RTP Packets → WebRTC\n */');
src = src.replace(/\*\s*Process H\.264 data from FFmpeg/g, '* Process H.264 data from native capture');

function findMethodIndex(source, methodName) {
  let idx = source.indexOf(methodName + '(');
  if (idx !== -1) return idx;

  idx = source.indexOf(methodName + ' =');
  if (idx !== -1) return idx;

  throw new Error(`Method ${methodName} not found`);
}

function replaceBlockFrom(source, startIdx, newFullMethod) {
  const braceStart = source.indexOf('{', startIdx);
  if (braceStart === -1) throw new Error(`No body brace at index ${startIdx}`);

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
  if (depth !== 0) throw new Error(`Unbalanced braces while parsing block at ${startIdx}`);

  const lineStart = source.lastIndexOf('\n', startIdx) + 1;
  const before = source.slice(0, lineStart);
  const after = source.slice(i);
  return before + newFullMethod + '\n' + after;
}

function replaceMethod(source, methodName, newFullMethod) {
  const idx = findMethodIndex(source, methodName);
  return replaceBlockFrom(source, idx, newFullMethod);
}

const startMethod = `private startCapture(): void {
  console.log(\`[WebRTCPeer][\${this.sessionId}] 🎬 Starting WGC/DXGI native capture\`);
  nativeCapture.start({
    width: this.streamConfig.width,
    height: this.streamConfig.height,
    fps: this.streamConfig.fps,
    bitrate: this.streamConfig.bitrate ?? 5000,
    useHardwareEncoder: false
  }, (nalBuffer: any) => {
    this.processH264Data(nalBuffer);
  });
  console.log(\`[WebRTCPeer][\${this.sessionId}] ✅ Native capture started\`);
}`;

const stopMethod = `private stopCapture(): void {
  if (nativeCapture?.stop) nativeCapture.stop();
  this.h264Parser.clear();
  console.log(\`[WebRTCPeer][\${this.sessionId}] 🛑 Native capture stopped\`);
}`;

src = replaceMethod(src, 'startCapture', startMethod);
src = replaceMethod(src, 'stopCapture', stopMethod);

if (!src.includes("native_capture.node")) throw new Error("native_capture.node require missing");

const startIdxCheck = src.indexOf('private startCapture');
if (startIdxCheck !== -1) {
  const slice = src.slice(startIdxCheck, startIdxCheck + 800);
  if (slice.includes('await ')) throw new Error("await still present near startCapture");
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('PATCH_OK');
