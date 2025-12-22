// capture_addon.cc - N-API Entry Point
// Exports CaptureProvider to JavaScript

#include <napi.h>
#include "wgc_capture.cc"
#include "dxgi_capture.cc"

class CaptureProviderAddon : public Napi::ObjectWrap<CaptureProviderAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "CaptureProvider", {
            InstanceMethod("start", &CaptureProviderAddon::Start),
            InstanceMethod("stop", &CaptureProviderAddon::Stop),
            InstanceMethod("onFrame", &CaptureProviderAddon::OnFrame),
            InstanceMethod("onError", &CaptureProviderAddon::OnError),
            InstanceMethod("isCapturing", &CaptureProviderAddon::IsCapturing)
        });

        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);
        env.SetInstanceData(constructor);

        exports.Set("CaptureProvider", func);
        return exports;
    }

    CaptureProviderAddon(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<CaptureProviderAddon>(info)
        , using_wgc_(false)
    {
        // Try WGC first, fallback to DXGI
        wgc_capture_ = std::make_unique<WGCCapture>();
        dxgi_capture_ = std::make_unique<DXGICapture>();
    }

    ~CaptureProviderAddon() {
        if (wgc_capture_) wgc_capture_.reset();
        if (dxgi_capture_) dxgi_capture_.reset();
    }

private:
    // start(config: CaptureConfig): Promise<void>
    Napi::Value Start(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsObject()) {
            Napi::TypeError::New(env, "Config object required").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        Napi::Object config = info[0].As<Napi::Object>();

        // Parse config
        WGCCapture::Config capture_config;
        capture_config.width = config.Get("width").As<Napi::Number>().Int32Value();
        capture_config.height = config.Get("height").As<Napi::Number>().Int32Value();
        capture_config.fps = config.Get("fps").As<Napi::Number>().Int32Value();
        capture_config.bitrate = config.Has("bitrate") ?
            config.Get("bitrate").As<Napi::Number>().Int32Value() : 5000;
        capture_config.use_hardware_encoder = config.Has("useHardwareEncoder") ?
            config.Get("useHardwareEncoder").As<Napi::Boolean>().Value() : true;

        // Must have callbacks registered first
        if (!frame_callback_ || !error_callback_) {
            Napi::Error::New(env, "Must register onFrame and onError callbacks first")
                .ThrowAsJavaScriptException();
            return env.Undefined();
        }

        // Try WGC first
        printf("[CaptureProvider] Attempting Windows Graphics Capture (PRIMARY)...\n");
        
        if (wgc_capture_->Initialize(capture_config, frame_callback_.Value(), error_callback_.Value())) {
            if (wgc_capture_->Start()) {
                using_wgc_ = true;
                printf("[CaptureProvider] ✅ Using WGC (PRIMARY)\n");
                return env.Undefined();
            }
        }

        // Fallback to DXGI
        printf("[CaptureProvider] WGC failed, falling back to DXGI...\n");
        
        if (dxgi_capture_->Initialize(capture_config, frame_callback_.Value(), error_callback_.Value())) {
            if (dxgi_capture_->Start()) {
                using_wgc_ = false;
                printf("[CaptureProvider] ⚠️  Using DXGI (FALLBACK)\n");
                return env.Undefined();
            }
        }

        // Both failed
        Napi::Error::New(env, "Both WGC and DXGI capture failed").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // stop(): void
    Napi::Value Stop(const Napi::CallbackInfo& info) {
        if (using_wgc_) {
            wgc_capture_->Stop();
        } else {
            dxgi_capture_->Stop();
        }
        return info.Env().Undefined();
    }

    // onFrame(callback: (frame: CaptureFrame) => void ): void
    Napi::Value OnFrame(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsFunction()) {
            Napi::TypeError::New(env, "Function callback required").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        frame_callback_ = Napi::Persistent(info[0].As<Napi::Function>());
        return env.Undefined();
    }

    // onError(callback: (error: Error) => void): void
    Napi::Value OnError(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();

        if (info.Length() < 1 || !info[0].IsFunction()) {
            Napi::TypeError::New(env, "Function callback required").ThrowAsJavaScriptException();
            return env.Undefined();
        }

        error_callback_ = Napi::Persistent(info[0].As<Napi::Function>());
        return env.Undefined();
    }

    // isCapturing(): boolean
    Napi::Value IsCapturing(const Napi::CallbackInfo& info) {
        bool is_capturing = using_wgc_ ?
            wgc_capture_->IsCapturing() :
            dxgi_capture_->IsCapturing();
        
        return Napi::Boolean::New(info.Env(), is_capturing);
    }

    std::unique_ptr<WGCCapture> wgc_capture_;
    std::unique_ptr<DXGICapture> dxgi_capture_;
    bool using_wgc_;

    Napi::FunctionReference frame_callback_;
    Napi::FunctionReference error_callback_;
};

// N-API module initialization
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    return CaptureProviderAddon::Init(env, exports);
}

NODE_API_MODULE(native_capture, InitAll)
