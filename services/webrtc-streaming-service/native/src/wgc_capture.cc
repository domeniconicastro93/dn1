// wgc_capture.cc - Windows Graphics Capture (WGC) Implementation
// PRIMARY capture provider using Windows.Graphics.Capture API

#include <napi.h>
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <winrt/Windows.Graphics.Capture.h>
#include <winrt/Windows.Graphics.DirectX.Direct3D11.h>
#include <windows.graphics.capture.interop.h>
#include <windows.graphics.directx.direct3d11.interop.h>
#include <vector>
#include <memory>
#include <atomic>

using namespace winrt;
using namespace Windows::Graphics::Capture;
using namespace Windows::Graphics::DirectX;
using namespace Windows::Graphics::DirectX::Direct3D11;

// Forward declare encoder
#include "h264_encoder.cc"

class WGCCapture {
public:
    struct Config {
        int width;
        int height;
        int fps;
        int bitrate;
        bool use_hardware_encoder;
    };

    WGCCapture() 
        : initialized_(false)
        , capturing_(false)
        , frame_count_(0)
        , start_time_ms_(0)
    {}

    ~WGCCapture() {
        Stop();
    }

    bool Initialize(const Config& config, Napi::Function frame_callback, Napi::Function error_callback) {
        config_ = config;
        frame_callback_ = Napi::ThreadSafeFunction::New(
            frame_callback.Env(),
            frame_callback,
            "WGC Frame Callback",
            0,
            1
        );
        error_callback_ = Napi::ThreadSafeFunction::New(
            error_callback.Env(),
            error_callback,
            "WGC Error Callback",
            0,
            1
        );

        try {
            // Initialize COM and WinRT
            init_apartment();

            // Create D3D11 device
            if (!CreateD3DDevice()) {
                ReportError("Failed to create D3D11 device");
                return false;
            }

            // Create WGC items
            if (!CreateCaptureItem()) {
                ReportError("Failed to create WGC capture item");
                return false;
            }

            // Initialize encoder
            H264Encoder::Config encoder_config;
            encoder_config.width = config.width;
            encoder_config.height = config.height;
            encoder_config.fps = config.fps;
            encoder_config.bitrate = config.bitrate;

            encoder_ = CreateEncoder(config.use_hardware_encoder);
            if (!encoder_->Initialize(encoder_config)) {
                ReportError("Failed to initialize H.264 encoder");
                return false;
            }

            initialized_ = true;
            printf("[WGCCapture] Initialized: %dx%d @ %dfps, %dkbps\n", 
                config.width, config.height, config.fps, config.bitrate);
            
            return true;

        } catch (const std::exception& e) {
            ReportError(std::string("WGC initialization failed: ") + e.what());
            return false;
        }
    }

    bool Start() {
        if (!initialized_ || capturing_) {
            return false;
        }

        try {
            // Create Direct3D11CaptureFramePool
            auto d3d_device = CreateDirect3DDevice(d3d_device_.get());
            auto item_size = capture_item_.Size();
            
            frame_pool_ = Direct3D11CaptureFramePool::Create(
                d3d_device,
                DirectXPixelFormat::B8G8R8A8UIntNormalized,
                2, // Number of buffers
                { item_size.Width, item_size.Height }
            );

            // Register frame arrived callback
            frame_pool_.FrameArrived({ this, &WGCCapture::OnFrameArrived });

            // Create capture session
            capture_session_ = frame_pool_.CreateCaptureSession(capture_item_);
            
            // Start capturing
            capture_session_.StartCapture();
            capturing_ = true;
            start_time_ms_ = GetTickCount64();

            printf("[WGCCapture] Capture started\n");
            return true;

        } catch (const std::exception& e) {
            ReportError(std::string("Failed to start capture: ") + e.what());
            return false;
        }
    }

    void Stop() {
        if (capture_session_) {
            try {
                capture_session_.Close();
                capture_session_ = nullptr;
            } catch (...) {}
        }

        if (frame_pool_) {
            try {
                frame_pool_.Close();
                frame_pool_ = nullptr;
            } catch (...) {}
        }

        if (encoder_) {
            encoder_->Cleanup();
            encoder_.reset();
        }

        if (frame_callback_) {
            frame_callback_.Release();
        }

        if (error_callback_) {
            error_callback_.Release();
        }

        capturing_ = false;
        initialized_ = false;
        
        printf("[WGCCapture] Stopped\n");
    }

    bool IsCapturing() const {
        return capturing_;
    }

private:
    bool CreateD3DDevice() {
        D3D_FEATURE_LEVEL feature_levels[] = { D3D_FEATURE_LEVEL_11_0 };
        
        HRESULT hr = D3D11CreateDevice(
            nullptr,
            D3D_DRIVER_TYPE_HARDWARE,
            nullptr,
            D3D11_CREATE_DEVICE_BGRA_SUPPORT,
            feature_levels,
            ARRAYSIZE(feature_levels),
            D3D11_SDK_VERSION,
            d3d_device_.put(),
            nullptr,
            d3d_context_.put()
        );

        return SUCCEEDED(hr);
    }

    bool CreateCaptureItem() {
        // Capture primary monitor
        auto interop = get_activation_factory<GraphicsCaptureItem, IGraphicsCaptureItemInterop>();
        
        HMONITOR h_monitor = MonitorFromPoint({ 0, 0 }, MONITOR_DEFAULTTOPRIMARY);
        
        HRESULT hr = interop->CreateForMonitor(
            h_monitor,
            guid_of<ABI::Windows::Graphics::Capture::IGraphicsCaptureItem>(),
            reinterpret_cast<void**>(put_abi(capture_item_))
        );

        return SUCCEEDED(hr);
    }

    void OnFrameArrived(Direct3D11CaptureFramePool const& sender, winrt::Windows::Foundation::IInspectable const&) {
        if (!capturing_) return;

        try {
            auto frame = sender.TryGetNextFrame();
            if (!frame) return;

            // Get surface
            auto surface = frame.Surface();
            auto access = surface.as<IDirect3DDxgiInterfaceAccess>();
            
            com_ptr<IDXGISurface> dxgi_surface;
            check_hresult(access->GetInterface(guid_of<IDXGISurface>(), dxgi_surface.put_void()));

            // Map surface to CPU
            DXGI_SURFACE_DESC desc;
            dxgi_surface->GetDesc(&desc);

            DXGI_MAPPED_RECT mapped_rect;
            HRESULT hr = dxgi_surface->Map(&mapped_rect, DXGI_MAP_READ);
            if (FAILED(hr)) {
                return;
            }

            // Encode frame
            int64_t timestamp_ms = GetTickCount64() - start_time_ms_;
            std::vector<uint8_t> h264_data = encoder_->Encode(
                static_cast<const uint8_t*>(mapped_rect.pBits),
                timestamp_ms
            );

            dxgi_surface->Unmap();

            // Send H.264 NAL units to JavaScript
            if (!h264_data.empty()) {
                SendFrameToJS(h264_data, timestamp_ms);
                frame_count_++;

                if (frame_count_ % 100 == 0) {
                    printf("[WGCCapture] Frames captured: %llu\n", frame_count_);
                }
            }

        } catch (const std::exception& e) {
            ReportError(std::string("Frame capture error: ") + e.what());
        }
    }

    void SendFrameToJS(const std::vector<uint8_t>& h264_data, int64_t timestamp_ms) {
        auto callback = [h264_data, timestamp_ms, this](Napi::Env env, Napi::Function js_callback) {
            Napi::Object frame = Napi::Object::New(env);
            
            // Create Buffer with H.264 NAL units
            Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::Copy(
                env,
                h264_data.data(),
                h264_data.size()
            );
            
            frame.Set("data", buffer);
            frame.Set("width", config_.width);
            frame.Set("height", config_.height);
            frame.Set("timestamp", static_cast<double>(timestamp_ms));
            frame.Set("format", "h264");

            js_callback.Call({ frame });
        };

        frame_callback_.NonBlockingCall(callback);
    }

    void ReportError(const std::string& message) {
        printf("[WGCCapture] ERROR: %s\n", message.c_str());
        
        if (error_callback_) {
            auto callback = [message](Napi::Env env, Napi::Function js_callback) {
                Napi::Error error = Napi::Error::New(env, message);
                js_callback.Call({ error.Value() });
            };
            error_callback_.NonBlockingCall(callback);
        }
    }

    // Configuration
    Config config_;
    bool initialized_;
    std::atomic<bool> capturing_;
    uint64_t frame_count_;
    uint64_t start_time_ms_;

    // D3D11
    com_ptr<ID3D11Device> d3d_device_;
    com_ptr<ID3D11DeviceContext> d3d_context_;

    // WGC
    GraphicsCaptureItem capture_item_{ nullptr };
    Direct3D11CaptureFramePool frame_pool_{ nullptr };
    GraphicsCaptureSession capture_session_{ nullptr };

    // Encoder    
    std::unique_ptr<IEncoder> encoder_;

    // JavaScript callbacks
    Napi::ThreadSafeFunction frame_callback_;
    Napi::ThreadSafeFunction error_callback_;
};
