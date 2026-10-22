# DevFlow Timer - Windows PowerShell 1-Line Installer
# Usage: irm https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "⚡ [DevFlow Timer] Memulai instalasi otomatis..." -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "✖ Node.js tidak ditemukan! Silakan install Node.js (>=20) dari https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "✖ Git tidak ditemukan! Silakan install Git dari https://git-scm.com" -ForegroundColor Red
    exit 1
}

# 3. Target directory
$geminiDir = Join-Path $HOME ".gemini"
$pluginsDir = Join-Path $geminiDir "config\plugins"
$targetDir = Join-Path $pluginsDir "dev-flow-timer"
$repoUrl = "https://github.com/roedyrustam/dev-flow-timer.git"

if (-not (Test-Path $pluginsDir)) {
    New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null
}

if (Test-Path $targetDir) {
    Write-Host "🔄 Plugin sudah terpasang. Memperbarui ke versi terbaru..." -ForegroundColor Yellow
    git -C $targetDir pull origin main
} else {
    Write-Host "📥 Mengunduh plugin dari GitHub..." -ForegroundColor Cyan
    git clone $repoUrl $targetDir
}

# 4. Install Global CLI Launcher in Antigravity bin
$binDir = Join-Path $geminiDir "antigravity\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$launcherPath = Join-Path $binDir "devflow.cmd"
$launcherContent = "@echo off`r`nnode `"$targetDir\bin\cli.mjs`" %*"
Set-Content -Path $launcherPath -Value $launcherContent -Encoding ASCII

# 5. Enable in config.json
$configFile = Join-Path $geminiDir "config\config.json"
try {
    $cfg = @{}
    if (Test-Path $configFile) {
        $raw = Get-Content $configFile -Raw
        if ($raw.Trim()) {
            $cfg = $raw | ConvertFrom-Json -AsHashtable
        }
    }
    if (-not $cfg.plugins) { $cfg.plugins = @{} }
    if (-not $cfg.plugins["dev-flow-timer"]) { $cfg.plugins["dev-flow-timer"] = @{} }
    $cfg.plugins["dev-flow-timer"]["enabled"] = $true
    $cfg | ConvertTo-Json -Depth 5 | Set-Content $configFile -Encoding UTF8
    Write-Host "✔ Plugin berhasil diaktifkan di konfigurasi Antigravity." -ForegroundColor Green
} catch {
    Write-Host "⚠ Catatan: Aktifkan plugin via Settings > Plugins jika diperlukan." -ForegroundColor Yellow
}

# 6. Success message
Write-Host ""
Write-Host "🎉 DevFlow Timer Berhasil Terpasang!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "👉 Terminal CLI : Ketik 'devflow status' atau 'devflow start 25'" -ForegroundColor Cyan
Write-Host "👉 Sidecar UI   : Buka menu Overview > Plugins > DevFlow Timer" -ForegroundColor Cyan
Write-Host "👉 Dashboard    : Ketik 'devflow dashboard' untuk membuka cockpit" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Silakan restart Antigravity atau buka workspace baru untuk memuat tools secara penuh.`n"
