// capture_addon.cc - N-API bindings with ThreadSafeFunction for frame callbacks
#include <napi.h>
#include <memory>
#include <vector>
#include <thread>
#include <atomic>
#include <chrono>
#include "h264_encoder.h"

// Capture state
struct CaptureContext {
    std::unique_ptr<IEncoder> encoder;
    std::thread capture_thread;
    std::atomic<bool> should_stop{false};
    napi_threadsafe_function tsfn = nullptr;
    IEncoder::Config config;
};

static std::unique_ptr<CaptureContext> g_context;

// Thread-safe function call data
struct TSFNCallData {
    uint8_t* data;
    size_t size;
};

// Called on JS thread when TSFN is invoked
static void CallJs(napi_env env, napi_value js_callback, void* context, void* data) {
    TSFNCallData* call_data = static_cast<TSFNCallData*>(data);
    
    if (call_data && js_callback != nullptr) {
        napi_value buffer;
        void* buffer_data;
        
        // Create Node.js Buffer
        napi_create_buffer_copy(env, call_data->size, call_data->data, &buffer_data, &buffer);
        
        // Call JS callback with buffer
        napi_value argv[1] = {buffer};
        napi_value global;
        napi_get_global(env, &global);
        napi_call_function(env, global, js_callback, 1, argv, nullptr);
    }
    
    // Free the data
    if (call_data) {
        delete[] call_data->data;
        delete call_data;
    }
}

// Capture thread function
static void CaptureThreadFunc(CaptureContext* ctx) {
    printf("[NativeCaptureAddon] Capture thread started\n");
    
    // IMMEDIATE TEST: Send fake NAL to verify TSFN works
    {
        uint8_t fake_nal[] = {0x00, 0x00, 0x00, 0x01, 0x09, 0x10}; // AUD NAL
        TSFNCallData* call_data = new TSFNCallData();
        call_data->data = new uint8_t[sizeof(fake_nal)];
        call_data->size = sizeof(fake_nal);
        memcpy(call_data->data, fake_nal, sizeof(fake_nal));
        
        napi_status status = napi_call_threadsafe_function(ctx->tsfn, call_data, napi_tsfn_nonblocking);
        if (status == napi_ok) {
            printf("[NativeCaptureAddon] Fake NAL sent via TSFN\n");
        } else {
            printf("[NativeCaptureAddon] ERROR: TSFN call failed with status %d\n", status);
            delete[] call_data->data;
            delete call_data;
        }
    }
    
    // Simple test pattern frame (black screen)
    int frame_size = ctx->config.width * ctx->config.height * 4; // BGRA
    std::vector<uint8_t> test_frame(frame_size, 0); // All zeros = black
    
    auto frame_duration = std::chrono::milliseconds(1000 / ctx->config.fps);
    int64_t timestamp_ms = 0;
    int frame_count = 0;
    
    while (!ctx->should_stop.load()) {
        auto frame_start = std::chrono::steady_clock::now();
        
        // Encode the test frame
        std::vector<uint8_t> nal_data = ctx->encoder->Encode(test_frame.data(), timestamp_ms);
        
        if (!nal_data.empty()) {
            // Copy NAL data to heap (will be freed in CallJs)
            TSFNCallData* call_data = new TSFNCallData();
            call_data->data = new uint8_t[nal_data.size()];
            call_data->size = nal_data.size();
            memcpy(call_data->data, nal_data.data(), nal_data.size());
            
            // Send to JS thread via TSFN
            napi_status status = napi_call_threadsafe_function(ctx->tsfn, call_data, napi_tsfn_nonblocking);
            if (status != napi_ok) {
                printf("[NativeCaptureAddon] TSFN call failed for frame %d\n", frame_count);
                delete[] call_data->data;
                delete call_data;
            }
            
            frame_count++;
            if (frame_count % ctx->config.fps == 0) {
                printf("[NativeCaptureAddon] Sent %d frames (NAL size: %zu bytes)\n", 
                       frame_count, nal_data.size());
            }
        }
        
        timestamp_ms += (1000 / ctx->config.fps);
        
        // Frame rate limiting
        auto frame_end = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(frame_end - frame_start);
        if (elapsed < frame_duration) {
            std::this_thread::sleep_for(frame_duration - elapsed);
        }
    }
    
    printf("[NativeCaptureAddon] Capture thread stopped, sent %d frames\n", frame_count);
}

// TSFN finalize callback
static void TSFNFinalize(napi_env env, void* finalize_data, void* finalize_hint) {
    printf("[NativeCaptureAddon] TSFN finalized\n");
}

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

    // Stop any existing capture
    if (g_context) {
        g_context->should_stop.store(true);
        if (g_context->capture_thread.joinable()) {
            g_context->capture_thread.join();
        }
        if (g_context->tsfn) {
            napi_release_threadsafe_function(g_context->tsfn, napi_tsfn_abort);
        }
        g_context.reset();
    }

    // Create new context
    g_context = std::make_unique<CaptureContext>();

    // Extract config
    Napi::Object config = info[0].As<Napi::Object>();
    g_context->config.width = config.Get("width").As<Napi::Number>().Int32Value();
    g_context->config.height = config.Get("height").As<Napi::Number>().Int32Value();
    g_context->config.fps = config.Get("fps").As<Napi::Number>().Int32Value();
    g_context->config.bitrate = config.Get("bitrate").As<Napi::Number>().Int32Value();

    // Create TSFN
    Napi::Function callback = info[1].As<Napi::Function>();
    napi_value async_resource_name;
    napi_create_string_utf8(env, "NativeCaptureTSFN", NAPI_AUTO_LENGTH, &async_resource_name);
    
    napi_status status = napi_create_threadsafe_function(
        env,
        callback,
        nullptr,  // async_resource
        async_resource_name,
        0,        // max_queue_size (0 = unlimited)
        1,        // initial_thread_count
        nullptr,  // thread_finalize_data
        TSFNFinalize,
        nullptr,  // context
        CallJs,
        &g_context->tsfn
    );

    if (status != napi_ok) {
        Napi::Error::New(env, "Failed to create ThreadSafeFunction").ThrowAsJavaScriptException();
        g_context.reset();
        return env.Undefined();
    }

    printf("[NativeCaptureAddon] ThreadSafeFunction initialized\n");

    // Initialize encoder
    g_context->encoder = CreateEncoder(false);
    if (!g_context->encoder->Initialize(g_context->config)) {
        napi_release_threadsafe_function(g_context->tsfn, napi_tsfn_abort);
        Napi::Error::New(env, "Failed to initialize encoder").ThrowAsJavaScriptException();
        g_context.reset();
        return env.Undefined();
    }

    printf("[NativeCaptureAddon] Encoder initialized: %dx%d @ %dfps, %dkbps\n", 
           g_context->config.width, g_context->config.height, 
           g_context->config.fps, g_context->config.bitrate);

    // Start capture thread
    g_context->should_stop.store(false);
    g_context->capture_thread = std::thread(CaptureThreadFunc, g_context.get());

    return env.Undefined();
}

// Stop capture
Napi::Value Stop(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (g_context) {
        printf("[NativeCaptureAddon] Stopping capture...\n");
        g_context->should_stop.store(true);
        
        if (g_context->capture_thread.joinable()) {
            g_context->capture_thread.join();
        }
        
        if (g_context->encoder) {
            g_context->encoder->Cleanup();
        }
        
        if (g_context->tsfn) {
            napi_release_threadsafe_function(g_context->tsfn, napi_tsfn_release);
            g_context->tsfn = nullptr;
        }
        
        g_context.reset();
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
