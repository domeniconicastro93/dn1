#include "h264_encoder.h"

extern "C" {
#include <x264.h>
}
#include <stdexcept>
#include <cstring>

class X264EncoderImpl : public IEncoder {
public:
    struct Config {
        int width;
        int height;
        int fps;
        int bitrate;  // kbps
    };

class X264EncoderImpl : public IEncoder {
public:
    bool Initialize(const H264Encoder::Config& config) override {
        return encoder_.Initialize(config);
    }

std::unique_ptr<IEncoder> CreateEncoder(bool use_hardware) {
    // TODO: Check for AMD GPU and return AMF encoder if available
    // For now, always return x264
    return std::make_unique<X264EncoderImpl>();
}

