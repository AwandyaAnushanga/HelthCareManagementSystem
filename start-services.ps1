Write-Host "Starting Healthcare Platform Services..." -ForegroundColor Green

# Clear PORT env var so services use their own .env ports
Remove-Item Env:\PORT -ErrorAction SilentlyContinue

$root = $PSScriptRoot
$dnsFix = Join-Path $root "dns-fix.js"

$services = @(
    @{ Name = "Patient";      Dir = "services\patient-service"; Port = 3001 },
    @{ Name = "Doctor";       Dir = "services\doctor-service";  Port = 3002 },
    @{ Name = "Appointment";  Dir = "services\appointment-service"; Port = 3003 },
    @{ Name = "Admin";        Dir = "services\admin-service";   Port = 3004 },
    @{ Name = "Notification"; Dir = "services\notification-service"; Port = 3005 }
)

# Kill any existing node processes first
Write-Host "Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

foreach ($svc in $services) {
    $fullDir = Join-Path $root $svc.Dir
    Write-Host "Starting $($svc.Name) Service on port $($svc.Port)..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "-r `"$dnsFix`" src/server.js" -WorkingDirectory $fullDir -NoNewWindow
}

Write-Host "`nWaiting 20 seconds for services to connect to MongoDB..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host "`nChecking services:" -ForegroundColor Yellow
foreach ($svc in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "  $($svc.Name) Service (port $($svc.Port)): OK" -ForegroundColor Green
    } catch {
        Write-Host "  $($svc.Name) Service (port $($svc.Port)): FAILED" -ForegroundColor Red
    }
}

Write-Host "`nDone! Now start the frontend in ANOTHER terminal:" -ForegroundColor Cyan
Write-Host '  cd D:\LaSenora\HelthCareManagementSystem\frontend; $env:PORT=4000; npx react-scripts start' -ForegroundColor White
