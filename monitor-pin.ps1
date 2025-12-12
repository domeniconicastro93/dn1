# Script per monitorare il PIN di pairing Apollo
# Esegui questo script PRIMA di avviare il client Strike

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   APOLLO PIN MONITOR" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Questo script monitora i log di Apollo per il PIN di pairing." -ForegroundColor Yellow
Write-Host "Quando il client Strike si connette, vedrai il PIN qui." -ForegroundColor Yellow
Write-Host ""
Write-Host "Premi CTRL+C per fermare il monitoraggio." -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Monitora il log in tempo reale
Get-Content "C:\Program Files\Apollo\config\sunshine.log" -Wait -Tail 0 | ForEach-Object {
    # Cerca righe che contengono "pin" o "pair"
    if ($_ -match "pin|pair|client|connect") {
        Write-Host $_ -ForegroundColor Green
        
        # Se troviamo un PIN, evidenzialo
        if ($_ -match "PIN:\s*(\d{4})") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host "   PIN TROVATO: $($matches[1])" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Yellow
            Write-Host ""
        }
    }
}
