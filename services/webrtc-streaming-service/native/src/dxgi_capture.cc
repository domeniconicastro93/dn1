// dxgi_capture.cc - DXGI Desktop Duplication (FALLBACK)
// Used when WGC is unavailable or fails

#include <napi.h>
#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <vector>
#include <memory>
#include <atomic>
#include <thread>

// Forward declare encoder
#include "h264_encoder.cc"

class DXGICapture {
public:
    struct Config {
        int width;
        int height;
        int fps;
        int bitrate;
        bool use_hardware_encoder;
    };

    DXGICapture()
        : initialized_(false)
        , capturing_(false)
        , frame_count_(0)
        , start_time_ms_(0)
    {}

    ~DXGICapture() {
        Stop();
    }

    bool Initialize(const Config& config, Napi::Function frame_callback, Napi::Function error_callback) {
        config_ = config;
        frame_callback_ = Napi::ThreadSafeFunction::New(
            frame_callback.Env(),
            frame_callback,
            "DXGI Frame Callback",
            0,
            1
        );
        error_callback_ = Napi::ThreadSafeFunction::New(
            error_callback.Env(),
            error_callback,
            "DXGI Error Callback",
            0,
            1
        );

        printf("[DXGICapture] ⚠️  FALLBACK: Using DXGI Desktop Duplication (WGC unavailable)\n");

        // Create D3D11 device
        if (!CreateD3DDevice()) {
            ReportError("Failed to create D3D11 device");
            return false;
        }

        // Get desktop duplication
        if (!CreateDesktopDuplication()) {
            ReportError("Failed to create desktop duplication");
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
        printf("[DXGICapture] Initialized: %dx%d @ %dfps, %dkbps\n",
            config.width, config.height, config.fps, config.bitrate);

        return true;
    }

    bool Start() {
        if (!initialized_ || capturing_) {
            return false;
        }

        capturing_ = true;
        start_time_ms_ = GetTickCount64();

        // Start capture thread
        capture_thread_ = std::thread(&DXGICapture::CaptureLoop, this);

        printf("[DXGICapture] Capture started (FALLBACK MODE)\n");
        return true;
    }

    void Stop() {
        capturing_ = false;

        if (capture_thread_.joinable()) {
            capture_thread_.join();
        }

        if (duplication_) {
            duplication_->Release();
            duplication_ = nullptr;
        }

        if (d3d_context_) {
            d3d_context_->Release();
            d3d_context_ = nullptr;
        }

        if (d3d_device_) {
            d3d_device_->Release();
            d3d_device_ = nullptr;
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

        initialized_ = false;
        printf("[DXGICapture] Stopped\n");
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
            0,
            feature_levels,
            ARRAYSIZE(feature_levels),
            D3D11_SDK_VERSION,
            &d3d_device_,
            nullptr,
            &d3d_context_
        );

        return SUCCEEDED(hr);
    }

    bool CreateDesktopDuplication() {
        // Get DXGI device
        IDXGIDevice* dxgi_device = nullptr;
        HRESULT hr = d3d_device_->QueryInterface(__uuidof(IDXGIDevice), (void**)&dxgi_device);
        if (FAILED(hr)) return false;

        // Get adapter
        IDXGIAdapter* dxgi_adapter = nullptr;
        hr = dxgi_device->GetParent(__uuidof(IDXGIAdapter), (void**)&dxgi_adapter);
        dxgi_device->Release();
        if (FAILED(hr)) return false;

        // Get output (monitor)
        IDXGIOutput* dxgi_output = nullptr;
        hr = dxgi_adapter->EnumOutputs(0, &dxgi_output);
        dxgi_adapter->Release();
        if (FAILED(hr)) return false;

        // Get output1
        IDXGIOutput1* dxgi_output1 = nullptr;
        hr = dxgi_output->QueryInterface(__uuidof(IDXGIOutput1), (void**)&dxgi_output1);
        dxgi_output->Release();
        if (FAILED(hr)) return false;

        // Create duplication
        hr = dxgi_output1->DuplicateOutput(d3d_device_, &duplication_);
        dxgi_output1->Release();

        return SUCCEEDED(hr);
    }

    void CaptureLoop() {
        int frame_interval_ms = 1000 / config_.fps;

        while (capturing_) {
            auto frame_start = GetTickCount64();

            if (CaptureFrame()) {
                frame_count_++;

                if (frame_count_ % 100 == 0) {
                    printf("[DXGICapture] Frames captured: %llu (FALLBACK)\n", frame_count_);
                }
            }

            // Frame rate limiting
            auto frame_end = GetTickCount64();
            int elapsed = static_cast<int>(frame_end - frame_start);
            int sleep_ms = frame_interval_ms - elapsed;

            if (sleep_ms > 0) {
                Sleep(sleep_ms);
            }
        }
    }

    bool CaptureFrame() {
        IDXGIResource* desktop_resource = nullptr;
        DXGI_OUTDUPL_FRAME_INFO frame_info;

        // Acquire next frame
        HRESULT hr = duplication_->AcquireNextFrame(50, &frame_info, &desktop_resource);

        if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
            return false; // No new frame
        }

        if (FAILED(hr)) {
            if (hr == DXGI_ERROR_ACCESS_LOST) {
                // Need to recreate duplication
                duplication_->Release();
                CreateDesktopDuplication();
            }
            return false;
        }

        // Get texture
        ID3D11Texture2D* texture = nullptr;
        hr = desktop_resource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&texture);
        desktop_resource->Release();

        if (FAILED(hr)) {
            duplication_->ReleaseFrame();
            return false;
        }

        // Map texture to CPU
        D3D11_MAPPED_SUBRESOURCE mapped;
        hr = d3d_context_->Map(texture, 0, D3D11_MAP_READ, 0, &mapped);

        if (SUCCEEDED(hr)) {
            // Encode frame
            int64_t timestamp_ms = GetTickCount64() - start_time_ms_;
            std::vector<uint8_t> h264_data = encoder_->Encode(
                static_cast<const uint8_t*>(mapped.pData),
                timestamp_ms
            );

            d3d_context_->Unmap(texture, 0);

            // Send H.264 NAL units to JavaScript
            if (!h264_data.empty()) {
                SendFrameToJS(h264_data, timestamp_ms);
            }
        }

        texture->Release();
        duplication_->ReleaseFrame();

        return true;
    }

    void SendFrameToJS(const std::vector<uint8_t>& h264_data, int64_t timestamp_ms) {
        auto callback = [h264_data, timestamp_ms, this](Napi::Env env, Napi::Function js_callback) {
            Napi::Object frame = Napi::Object::New(env);

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
        printf("[DXGICapture] ERROR: %s\n", message.c_str());

        if (error_callback_) {
            auto callback = [message](Napi::Env env, Napi::Function js_callback) {
                Napi::Error error = Napi::Error::New(env, message);
                js_callback.Call({ error.Value() });
            };
            error_callback_.NonBlockingCall(callback);
        }
    }

    Config config_;
    bool initialized_;
    std::atomic<bool> capturing_;
    uint64_t frame_count_;
    uint64_t start_time_ms_;
    std::thread capture_thread_;

    ID3D11Device* d3d_device_;
    ID3D11DeviceContext* d3d_context_;
    IDXGIOutputDuplication* duplication_;

    std::unique_ptr<IEncoder> encoder_;

    Napi::ThreadSafeFunction frame_callback_;
    Napi::ThreadSafeFunction error_callback_;
};
