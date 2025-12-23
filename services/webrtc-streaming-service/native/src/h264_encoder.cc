// h264_encoder.cc - x264 Software H.264 Encoder
// Encoder-agnostic interface for future AMF integration

#include "h264_encoder.h"
#include <cstdint>
#include <vector>
#include <memory>
#include <map>

extern "C" {
#include <x264.h>
}

// X264EncoderImpl implementation

X264EncoderImpl::X264EncoderImpl() 
    : encoder_(nullptr), initialized_(false) {
    printf("[X264] CONSTRUCTOR this=%p\n", this);
}

X264EncoderImpl::~X264EncoderImpl() {
    printf("[X264] DESTRUCTOR this=%p\n", this);
    Cleanup();
}

bool X264EncoderImpl::Initialize(const IEncoder::Config& config) {
    config_ = config;

    // Configure x264 parameters
    x264_param_t param;
    if (x264_param_default_preset(&param, "ultrafast", "zerolatency") < 0) {
        return false;
    }

    // Resolution and framerate
    param.i_width = config.width;
    param.i_height = config.height;
    param.i_fps_num = config.fps;
    param.i_fps_den = 1;

    // Bitrate control (VBR)
    param.rc.i_rc_method = X264_RC_ABR;
    param.rc.i_bitrate = config.bitrate;
    param.rc.i_vbv_max_bitrate = static_cast<int>(config.bitrate * 1.5);
    param.rc.i_vbv_buffer_size = config.bitrate;

    // WebRTC-friendly GOP: Force IDR every 1 second
    param.i_keyint_max = config.fps;       // IDR every 1 second
    param.i_keyint_min = config.fps;       // Min = max (disable scenecut)
    param.b_intra_refresh = 0;             // CRITICAL: Disable gradual refresh, use full IDR
    param.i_scenecut_threshold = 0;        // Disable scene-cut detection

    // Low latency settings
    param.i_threads = 4;
    param.b_sliced_threads = 1;
    param.i_sync_lookahead = 0;
    param.rc.i_lookahead = 0;

    // Annex B output with SPS/PPS headers
    param.b_annexb = 1;
    param.b_repeat_headers = 1;            // CRITICAL: Emit SPS/PPS before each IDR

    // Profile
    param.i_csp = X264_CSP_I420;
    x264_param_apply_profile(&param, "baseline");

    // Create encoder
    encoder_ = x264_encoder_open(&param);
    if (!encoder_) {
        return false;
    }
    
    // PHASE 1 & 2: Log encoder lifecycle and final params
    printf("[X264] INIT this=%p fps=%d keyint_max=%d keyint_min=%d intra_refresh=%d repeat_headers=%d scenecut=%d\n",
           this, config.fps, param.i_keyint_max, param.i_keyint_min, 
           param.b_intra_refresh, param.b_repeat_headers, param.i_scenecut_threshold);
    printf("[X264] FINAL PARAMS after x264_encoder_open: i_keyint_max=%d i_keyint_min=%d b_intra_refresh=%d i_scenecut_threshold=%d b_repeat_headers=%d b_annexb=%d\n",
           param.i_keyint_max, param.i_keyint_min, param.b_intra_refresh, 
           param.i_scenecut_threshold, param.b_repeat_headers, param.b_annexb);

    // Allocate picture
    if (x264_picture_alloc(&picture_in_, X264_CSP_I420, config.width, config.height) < 0) {
        x264_encoder_close(encoder_);
        encoder_ = nullptr;
        return false;
    }

    initialized_ = true;
    return true;
}

std::vector<uint8_t> X264EncoderImpl::Encode(const uint8_t* bgra_data, int64_t timestamp_ms) {
    std::vector<uint8_t> output;

    if (!initialized_ || !bgra_data) {
        return output;
    }

    // Convert BGRA to I420 (YUV420p)
    BGRAToI420(bgra_data, picture_in_.img.plane[0], picture_in_.img.plane[1], picture_in_.img.plane[2]);

    // Set timestamp
    picture_in_.i_pts = timestamp_ms * config_.fps / 1000;

    // Encode
    x264_picture_t pic_out;
    x264_nal_t* nals;
    int num_nals;
    int frame_size = x264_encoder_encode(encoder_, &nals, &num_nals, &picture_in_, &pic_out);

    if (frame_size > 0) {
        // PHASE 3: Count NAL types and detect first SPS/PPS/IDR
        static std::map<int, int> nal_counts;
        static std::map<int, bool> nal_seen;
        static int64_t last_log_ts = 0;
        
        for (int i = 0; i < num_nals; i++) {
            int nal_type = nals[i].i_type;
            nal_counts[nal_type]++;
            
            // First time seeing critical NAL types
            if ((nal_type == 5 || nal_type == 7 || nal_type == 8) && !nal_seen[nal_type]) {
                nal_seen[nal_type] = true;
                printf("[X264] FIRST NAL TYPE %d detected at timestamp %lld ms (size=%d bytes)\\n", 
                       nal_type, timestamp_ms, nals[i].i_payload);
            }
        }
        
        // Log NAL counts every second
        int64_t current_sec = timestamp_ms / 1000;
        if (current_sec > last_log_ts) {
            printf("[X264] NAL counts per second: ");
            for (const auto& pair : nal_counts) {
                printf("type_%d=%d ", pair.first, pair.second);
            }
            printf("\\n");
            nal_counts.clear();
            last_log_ts = current_sec;
        }
        
        // Collect all NAL units (Annex B format)
        for (int i = 0; i < num_nals; i++) {
            output.insert(output.end(), nals[i].p_payload, nals[i].p_payload + nals[i].i_payload);
        }
    }

    return output;
}

void X264EncoderImpl::Cleanup() {
    printf("[X264] CLEANUP this=%p\n", this);
    if (encoder_) {
        // Flush delayed frames
        while (x264_encoder_delayed_frames(encoder_)) {
            x264_picture_t pic_out;
            x264_nal_t* nals;
            int num_nals;
            x264_encoder_encode(encoder_, &nals, &num_nals, nullptr, &pic_out);
        }

        x264_encoder_close(encoder_);
        encoder_ = nullptr;
    }

    if (initialized_) {
        x264_picture_clean(&picture_in_);
        initialized_ = false;
    }
}

void X264EncoderImpl::BGRAToI420(const uint8_t* bgra, uint8_t* y, uint8_t* u, uint8_t* v) {
    int width = config_.width;
    int height = config_.height;

    // Simple BGRA to I420 conversion
    for (int row = 0; row < height; row++) {
        for (int col = 0; col < width; col++) {
            int bgra_idx = (row * width + col) * 4;
            int y_idx = row * width + col;

            uint8_t b = bgra[bgra_idx + 0];
            uint8_t g = bgra[bgra_idx + 1];
            uint8_t r = bgra[bgra_idx + 2];

            // Y = 0.299*R + 0.587*G + 0.114*B
            y[y_idx] = static_cast<uint8_t>((77 * r + 150 * g + 29 * b) >> 8);

            // U and V sampled at 2x2
            if (row % 2 == 0 && col % 2 == 0) {
                int uv_idx = (row / 2) * (width / 2) + (col / 2);
                // U = -0.169*R - 0.331*G + 0.500*B + 128
                u[uv_idx] = static_cast<uint8_t>(((-43 * r - 85 * g + 128 * b) >> 8) + 128);
                // V = 0.500*R - 0.419*G - 0.081*B + 128
                v[uv_idx] = static_cast<uint8_t>(((128 * r - 107 * g - 21 * b) >> 8) + 128);
            }
        }
    }
}

// Factory function implementation
std::unique_ptr<IEncoder> CreateEncoder(bool use_hardware) {
    // For now, always return x264 software encoder
    // Future: Check use_hardware flag and return AMF encoder if available
    return std::make_unique<X264EncoderImpl>();
}