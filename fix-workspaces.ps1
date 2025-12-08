# Fix workspace:* dependencies to * for npm compatibility

Get-ChildItem -Path . -Recurse -Filter "package.json" | 
    Where-Object { 
        $_.FullName -notlike "*node_modules*" -and 
        $_.FullName -notlike "*.next*" -and
        $_.FullName -notlike "*dist*"
    } | 
    ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        if ($content -match 'workspace:\*') {
            $newContent = $content -replace 'workspace:\*', '*'
            Set-Content -Path $_.FullName -Value $newContent -NoNewline
            Write-Host "Fixed: $($_.FullName)"
        }
    }

Write-Host "`nDone! All workspace:* dependencies have been changed to * for npm compatibility."

