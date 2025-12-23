{
  "targets": [
    {
      "target_name": "native_capture",
      "sources": [
        "native/src/capture_addon.cc",
        "native/src/wgc_capture.cc",
        "native/src/dxgi_capture.cc",
        "native/src/h264_encoder.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "C:/vcpkg/installed/x64-windows/include"
      ],
      "libraries": [
        "-ld3d11.lib",
        "-ldxgi.lib",
        "-lwindowsapp.lib",
        "C:/vcpkg/installed/x64-windows/lib/libx264.lib"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "UNICODE",
        "_UNICODE"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "AdditionalOptions": [ "/std:c++17", "/await" ],
          "ExceptionHandling": 1
        }
      },
      "conditions": [
        ["OS=='win'", {
          "defines": [ "WIN32" ]
        }]
      ]
    }
  ]
}
