/**
 * NVENC Encoding Configuration
 * 
 * Implements exact NVENC settings as per Master Prompt:
 * - Preset: P1 / low-latency-high-quality
 * - Rate control: CBR 8-15 Mbps
 * - GOP: 120 (fps * 2 for 60fps)
 * - Low latency VBV
 */

export interface NVENCConfig {
  preset: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7';
  rateControl: 'CBR' | 'VBR' | 'CQP';
  bitrate: number; // kbps
  maxBitrate?: number; // kbps (for VBR)
  gop: number; // Group of Pictures (keyframe interval)
  vbvBufferSize: number; // VBV buffer size for low latency
  codec: 'H264' | 'HEVC';
  profile?: string; // e.g., 'high', 'main', 'baseline'
  level?: string; // e.g., '4.1', '5.0'
  bFrames: number; // 0 for low latency
  refFrames: number; // Reference frames
  lookahead: number; // Lookahead frames (0 for low latency)
}

/**
 * Get NVENC configuration for replay encoding
 * 
 * @param fps - Target FPS (60, 120, 240)
 * @param qualityPreset - Quality preset (low, medium, high)
 * @param codec - Codec to use (H264 or HEVC)
 */
export function getNVENCConfig(
  fps: number = 60,
  qualityPreset: 'low' | 'medium' | 'high' = 'high',
  codec: 'H264' | 'HEVC' = 'H264',
  preset: 'P1' | 'P2' = 'P1'
): NVENCConfig {
  // Bitrate based on quality preset
  const bitrateMap = {
    low: 8000, // 8 Mbps
    medium: 12000, // 12 Mbps
    high: 15000, // 15 Mbps
  };

  const bitrate = bitrateMap[qualityPreset];

  // GOP = fps * 2 (keyframe every 2 seconds)
  // For 60fps: GOP = 120
  // For 120fps: GOP = 240
  // For 240fps: GOP = 480
  const gop = fps * 2;

  // VBV buffer size for low latency (smaller buffer = lower latency)
  // Formula: bitrate * 0.5 seconds (for low latency)
  const vbvBufferSize = Math.floor((bitrate * 1000) / 8 * 0.5); // bytes

  return {
    preset, // P1 (low-latency-high-quality) or P2 (low-latency)
    rateControl: 'CBR', // Constant Bitrate for predictable bitrate
    bitrate,
    gop,
    vbvBufferSize,
    codec,
    profile: codec === 'H264' ? 'high' : 'main',
    level: codec === 'H264' ? '4.1' : '5.0',
    bFrames: 0, // No B-frames for low latency
    refFrames: 1, // Single reference frame for low latency
    lookahead: 0, // No lookahead for low latency
  };
}

/**
 * Get NVENC config with VBR (Variable Bitrate) rate control
 * 
 * For scenarios where CBR is too restrictive, VBR can provide better quality
 * at the cost of variable bitrate.
 */
export function getNVENCConfigVBR(
  fps: number = 60,
  qualityPreset: 'low' | 'medium' | 'high' = 'high',
  codec: 'H264' | 'HEVC' = 'H264',
  preset: 'P1' | 'P2' = 'P1'
): NVENCConfig {
  const baseConfig = getNVENCConfig(fps, qualityPreset, codec, preset);
  
  // VBR: max_bitrate = 1.5 * target (as per Master Prompt)
  const maxBitrate = Math.floor(baseConfig.bitrate * 1.5);

  return {
    ...baseConfig,
    rateControl: 'VBR',
    maxBitrate,
  };
}

/**
 * Generate FFmpeg NVENC command line arguments
 * 
 * @param config - NVENC configuration
 * @param inputFile - Input file path (or '-' for stdin)
 * @param outputFile - Output file path (or '-' for stdout)
 */
export function generateFFmpegNVENCArgs(
  config: NVENCConfig,
  inputFile: string = '-',
  outputFile: string = '-'
): string[] {
  const args: string[] = [];

  // Input
  args.push('-i', inputFile);

  // Video codec
  if (config.codec === 'H264') {
    args.push('-c:v', 'h264_nvenc');
  } else {
    args.push('-c:v', 'hevc_nvenc');
  }

  // Preset
  args.push('-preset', config.preset);

  // Rate control
  if (config.rateControl === 'CBR') {
    args.push('-rc', 'cbr');
    args.push('-b:v', `${config.bitrate}k`);
    args.push('-maxrate:v', `${config.bitrate}k`);
    args.push('-bufsize:v', `${config.vbvBufferSize}`);
  } else if (config.rateControl === 'VBR') {
    args.push('-rc', 'vbr');
    args.push('-b:v', `${config.bitrate}k`);
    if (config.maxBitrate) {
      args.push('-maxrate:v', `${config.maxBitrate}k`);
    }
  }

  // GOP
  args.push('-g', config.gop.toString());

  // Profile and level
  if (config.profile) {
    args.push('-profile:v', config.profile);
  }
  if (config.level) {
    args.push('-level', config.level);
  }

  // B-frames
  args.push('-bf', config.bFrames.toString());

  // Reference frames
  args.push('-refs', config.refFrames.toString());

  // Lookahead
  args.push('-rc-lookahead', config.lookahead.toString());

  // Low latency tuning
  args.push('-tune', 'll'); // Low latency

  // VBV buffer
  args.push('-vbv-bufsize', config.vbvBufferSize.toString());

  // Output
  args.push('-f', 'mp4');
  args.push(outputFile);

  return args;
}

/**
 * Generate GStreamer NVENC pipeline string
 * 
 * @param config - NVENC configuration
 * @param inputSource - Input source (e.g., 'appsrc')
 * @param outputSink - Output sink (e.g., 'filesink')
 */
export function generateGStreamerNVENCPipeline(
  config: NVENCConfig,
  inputSource: string = 'appsrc',
  outputSink: string = 'filesink'
): string {
  const pipeline: string[] = [];

  // Input
  pipeline.push(inputSource);

  // Parser
  if (config.codec === 'H264') {
    pipeline.push('h264parse');
  } else {
    pipeline.push('h265parse');
  }

  // NVENC encoder
  if (config.codec === 'H264') {
    pipeline.push('nvh264enc');
  } else {
    pipeline.push('nvh265enc');
  }

  // Encoder properties
  pipeline.push(`preset=${config.preset}`);
  pipeline.push(`bitrate=${config.bitrate * 1000}`); // kbps to bps
  pipeline.push(`gop-size=${config.gop}`);
  pipeline.push(`vbv-buffer-size=${config.vbvBufferSize}`);
  pipeline.push('rc-mode=cbr'); // Constant bitrate
  pipeline.push('tune=low-latency');

  // Output
  pipeline.push('mp4mux');
  pipeline.push(outputSink);

  return pipeline.join(' ! ');
}

