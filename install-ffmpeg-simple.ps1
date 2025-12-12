Write-Host "Installing FFmpeg..." -ForegroundColor Cyan

$ffmpegDir = "C:\ffmpeg"
$ffmpegBin = "$ffmpegDir\bin"
$downloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipFile = "$env:TEMP\ffmpeg.zip"

if (Test-Path "$ffmpegBin\ffmpeg.exe") {
    Write-Host "FFmpeg already installed!" -ForegroundColor Green
    exit 0
}

Write-Host "Downloading FFmpeg..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing

Write-Host "Extracting..."
Expand-Archive -Path $zipFile -DestinationPath $env:TEMP -Force

$extractedFolder = Get-ChildItem -Path $env:TEMP -Filter "ffmpeg-*" -Directory | Select-Object -First 1

if ($extractedFolder) {
    if (Test-Path $ffmpegDir) {
        Remove-Item -Path $ffmpegDir -Recurse -Force
    }
    
    Move-Item -Path $extractedFolder.FullName -Destination $ffmpegDir -Force
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$ffmpegBin*") {
        $newPath = "$currentPath;$ffmpegBin"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    }
    
    Write-Host "FFmpeg installed at: $ffmpegDir" -ForegroundColor Green
    Write-Host "RESTART YOUR TERMINAL!" -ForegroundColor Yellow
}

Remove-Item -Path $zipFile -Force -ErrorAction SilentlyContinue
