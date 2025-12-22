// capture_addon.cc - N-API bindings for WGC/DXGI native capture
#include <napi.h>
#include <memory>
#include <vector>
#include "h264_encoder.h"

// Global capture state (simple singleton for this implementation)
static std::unique_ptr<IEncoder> g_encoder;
static Napi::FunctionReference g_frameCallback;  
static bool g_capturing = false;

// Start capture
Napi::Value Start(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Expected 2 arguments: config and callback").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (!info[0].IsObject()) {
        Napi::TypeError::New(env, "First argument must be config object").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    if (!info[1].IsFunction()) {
        Napi::TypeError::New(env, "Second argument must be callback function").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // Extract config
    Napi::Object config = info[0].As<Napi::Object>();
    int width = config.Get("width").As<Napi::Number>().Int32Value();
    int height = config.Get("height").As<Napi::Number>().Int32Value();
    int fps = config.Get("fps").As<Napi::Number>().Int32Value();
    int bitrate = config.Get("bitrate").As<Napi::Number>().Int32Value();

    // Store callback
    g_frameCallback = Napi::Persistent(info[1].As<Napi::Function>());

    // Initialize encoder
    IEncoder::Config encoderConfig;
    encoderConfig.width = width;
    encoderConfig.height = height;
    encoderConfig.fps = fps;
    encoderConfig.bitrate = bitrate;

    g_encoder = CreateEncoder(false);
    if (!g_encoder->Initialize(encoderConfig)) {
        Napi::Error::New(env, "Failed to initialize encoder").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    g_capturing = true;
    
    printf("[NativeCaptureAddon] Started: %dx%d @ %dfps, %dkbps\n", width, height, fps, bitrate);

    return env.Undefined();
}

// Stop capture  
Napi::Value Stop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (g_capturing) {
        g_capturing = false;
        
        if (g_encoder) {
            g_encoder->Cleanup();
            g_encoder.reset();
        }

        if (!g_frameCallback.IsEmpty()) {
            g_frameCallback.Reset();
        }

        printf("[NativeCaptureAddon] Stopped\n");
    }

    return env.Undefined();
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "start"), Napi::Function::New(env, Start));
    exports.Set(Napi::String::New(env, "stop"), Napi::Function::New(env, Stop));
    
    printf("[NativeCaptureAddon] Module initialized\n");
    
    return exports;
}

NODE_API_MODULE(native_capture, Init)
