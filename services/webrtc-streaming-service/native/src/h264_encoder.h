#pragma once

#include <vector>
#include <cstdint>
#include <memory>

extern "C" {
#include <x264.h>
}

// Encoder interface
class IEncoder {
public:
    struct Config {
        int width;
        int height;
        int fps;
        int bitrate;  // kbps
    };

    virtual ~IEncoder() = default;
    virtual bool Initialize(const Config& config) = 0;
    virtual std::vector<uint8_t> Encode(const uint8_t* rgba_data, int64_t timestamp_ms) = 0;
    virtual void Cleanup() = 0;
};

// X264 software encoder implementation
class X264EncoderImpl : public IEncoder {
public:
    X264EncoderImpl();
    ~X264EncoderImpl() override;

    bool Initialize(const Config& config) override;
    std::vector<uint8_t> Encode(const uint8_t* bgra_data, int64_t timestamp_ms) override;
    void Cleanup() override;

private:
    void BGRAToI420(const uint8_t* bgra, uint8_t* y, uint8_t* u, uint8_t* v);

    x264_t* encoder_;
    x264_picture_t picture_in_;
    Config config_;
    bool initialized_;
};

// Factory function
std::unique_ptr<IEncoder> CreateEncoder(bool use_hardware);