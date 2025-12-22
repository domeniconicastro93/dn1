#pragma once

#include <cstdint>

struct CaptureConfig {
    int width;
    int height;
    int fps;
    int bitrateKbps;
    bool useHardwareEncoder;
};
