{
  "targets": [
    {
      "target_name": "native_capture",
      "sources": [
        "src/capture_addon.cc",
        "src/wgc_capture.cc", 
        "src/dxgi_capture.cc",
        "src/h264_encoder.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [
        "-ld3d11.lib",
        "-ldxgi.lib",
        "-lwindowsapp.lib"
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
