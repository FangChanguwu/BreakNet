$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$DistPath = Join-Path $ProjectRoot "dist"
$NginxRoot = "C:\nginx"
$NginxHtml = Join-Path $NginxRoot "html"
$TargetPath = Join-Path $NginxHtml "breaknet"
$NginxExe = Join-Path $NginxRoot "nginx.exe"

function Resolve-FullPath([string]$PathValue) {
  return [System.IO.Path]::GetFullPath($PathValue)
}

Write-Host "Building BreakNet frontend..."
Push-Location $ProjectRoot
try {
  npm run build
}
finally {
  Pop-Location
}

if (!(Test-Path -LiteralPath $DistPath)) {
  throw "dist directory does not exist. Build may have failed."
}

if (!(Test-Path -LiteralPath $NginxExe)) {
  throw "nginx.exe not found: $NginxExe"
}

if (!(Test-Path -LiteralPath $NginxHtml)) {
  New-Item -ItemType Directory -Path $NginxHtml | Out-Null
}

if (!(Test-Path -LiteralPath $TargetPath)) {
  New-Item -ItemType Directory -Path $TargetPath | Out-Null
}

$HtmlFullPath = Resolve-FullPath $NginxHtml
$TargetFullPath = Resolve-FullPath $TargetPath
$ExpectedPrefix = $HtmlFullPath.TrimEnd("\") + "\"

if (!$TargetFullPath.StartsWith($ExpectedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Target path is outside nginx html directory. Deployment stopped: $TargetFullPath"
}

Write-Host "Cleaning target directory: $TargetFullPath"
Get-ChildItem -LiteralPath $TargetPath -Force | Remove-Item -Recurse -Force

Write-Host "Copying dist to nginx html..."
Copy-Item -Path (Join-Path $DistPath "*") -Destination $TargetPath -Recurse -Force

Write-Host "Reloading nginx..."
Push-Location $NginxRoot
try {
  & $NginxExe -s reload
}
finally {
  Pop-Location
}

Write-Host "Deploy done: $TargetFullPath"
