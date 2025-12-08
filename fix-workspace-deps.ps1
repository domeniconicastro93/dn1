# Fix workspace dependencies for pnpm
# Changes "*" to "workspace:*" for @strike packages

$packageFiles = Get-ChildItem -Recurse -Filter package.json | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "\.next" 
}

foreach ($file in $packageFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace "@strike/*": "*" with "@strike/*": "workspace:*"
    $content = $content -replace '"@strike/([^"]+)": "\*"', '"@strike/$1": "workspace:*"'
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done! All workspace dependencies fixed."

