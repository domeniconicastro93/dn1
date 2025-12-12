# FFmpeg Installation Script for Windows
# Run this script to download and install FFmpeg

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FFmpeg Installation for Strike" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ffmpegDir = "C:\ffmpeg"
$ffmpegBin = "$ffmpegDir\bin"
$downloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = "$env:TEMP\ffmpeg.zip"

# Check if already installed
if (Test-Path "$ffmpegBin\ffmpeg.exe") {
    Write-Host "✅ FFmpeg is already installed at: $ffmpegBin" -ForegroundColor Green
    Write-Host ""
    & "$ffmpegBin\ffmpeg.exe" -version | Select-Object -First 1
    Write-Host ""
    Write-Host "If you want to reinstall, delete $ffmpegDir and run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host "📥 Downloading FFmpeg..." -ForegroundColor Yellow
Write-Host "   URL: $downloadUrl" -ForegroundColor Gray
Write-Host ""

try {
    # Download FFmpeg
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "✅ Download complete!" -ForegroundColor Green
    Write-Host ""
    
    # Extract
    Write-Host "📦 Extracting FFmpeg..." -ForegroundColor Yellow
    Expand-Archive -Path $zipFile -DestinationPath $env:TEMP -Force
    
    # Find extracted folder
    $extractedFolder = Get-ChildItem -Path $env:TEMP -Filter "ffmpeg-*" -Directory | Select-Object -First 1
    
    if ($extractedFolder) {
        # Move to C:\ffmpeg
        Write-Host "📁 Installing to $ffmpegDir..." -ForegroundColor Yellow
        
        if (Test-Path $ffmpegDir) {
            Remove-Item -Path $ffmpegDir -Recurse -Force
        }
        
        Move-Item -Path $extractedFolder.FullName -Destination $ffmpegDir -Force
        Write-Host "✅ FFmpeg installed!" -ForegroundColor Green
        Write-Host ""
        
        # Add to PATH
        Write-Host "🔧 Adding to PATH..." -ForegroundColor Yellow
        
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        
        if ($currentPath -notlike "*$ffmpegBin*") {
            $newPath = "$currentPath;$ffmpegBin"
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
            Write-Host "✅ Added to PATH!" -ForegroundColor Green
            Write-Host ""
            Write-Host "⚠️  IMPORTANT: Restart your terminal for PATH changes to take effect!" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Already in PATH!" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Installation Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "FFmpeg installed at: $ffmpegDir" -ForegroundColor White
        Write-Host "Binary location: $ffmpegBin\ffmpeg.exe" -ForegroundColor White
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Restart your terminal" -ForegroundColor White
        Write-Host "  2. Verify: ffmpeg -version" -ForegroundColor White
        Write-Host "  3. Start WebRTC service: cd services\webrtc-streaming-service && pnpm run dev" -ForegroundColor White
        Write-Host ""
        
    } else {
        Write-Host "❌ Error: Could not find extracted folder" -ForegroundColor Red
        exit 1
    }
    
    # Cleanup
    Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Error during installation: $_" -ForegroundColor Red
    exit 1
}
