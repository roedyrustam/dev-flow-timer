# DevFlow Timer - Windows PowerShell 1-Line Installer
# Usage: irm https://raw.githubusercontent.com/roedyrustam/dev-flow-timer/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "⚡ [DevFlow Timer] Starting automatic installation..." -ForegroundColor Cyan

# 1. Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "✖ Node.js not found! Please install Node.js (>=20) from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Check Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "✖ Git not found! Please install Git from https://git-scm.com" -ForegroundColor Red
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
    Write-Host "🔄 Plugin already installed. Updating to latest version..." -ForegroundColor Yellow
    git -C $targetDir pull origin main
} else {
    Write-Host "📥 Downloading plugin from GitHub..." -ForegroundColor Cyan
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
    Write-Host "✔ Plugin successfully enabled in Antigravity config." -ForegroundColor Green
} catch {
    Write-Host "⚠ Note: Enable the plugin via Settings > Plugins if needed." -ForegroundColor Yellow
}

# 6. Success message
Write-Host ""
Write-Host "🎉 DevFlow Timer Successfully Installed!" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "👉 Terminal CLI : Run 'devflow status' or 'devflow start 25'" -ForegroundColor Cyan
Write-Host "👉 Sidecar UI   : Open Overview > Plugins > DevFlow Timer" -ForegroundColor Cyan
Write-Host "👉 Dashboard    : Run 'devflow dashboard' to open the cockpit" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Please restart Antigravity or open a new workspace to fully load tools.`n"
