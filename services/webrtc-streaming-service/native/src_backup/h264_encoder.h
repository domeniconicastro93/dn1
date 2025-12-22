#pragma once

#include <vector>
#include <cstdint>
#include <string>
#include <memory>

// Encoder interface
class IEncoder {
public:
    struct Config {
        int width;
        int height;
        int fps;
        int bitrate;
    };

    virtual ~IEncoder() = default;
    virtual bool Initialize(const Config& config) = 0;
    virtual std::vector<uint8_t> Encode(const uint8_t* rgba_data, int64_t timestamp_ms) = 0;
    virtual void Cleanup() = 0;
};

// Factory function
std::unique_ptr<IEncoder> CreateEncoder(bool use_hardware);
