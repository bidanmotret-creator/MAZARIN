<#
  Mengatur / mengganti kata sandi seorang pengguna (dipakai admin).
  Jalankan dari folder proyek:
    powershell -ExecutionPolicy Bypass -File .\tools\set-password.ps1 -Email nama@contoh.com

  Syarat: pengguna sudah ada di MASTER_USER dengan Status = Active, dan .env.local sudah berisi
  APPS_SCRIPT_URL + APPS_SCRIPT_SECRET. Kata sandi dikirim sebagai HASH, bukan teks asli.
#>
param([Parameter(Mandatory = $true)][string]$Email)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path .env.local)) { throw ".env.local tidak ditemukan." }
$cfg = @{}
Get-Content .env.local | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { $cfg[$matches[1]] = $matches[2] } }
if (-not $cfg.APPS_SCRIPT_URL -or -not $cfg.APPS_SCRIPT_SECRET) { throw "APPS_SCRIPT_URL / APPS_SCRIPT_SECRET belum diisi di .env.local" }
if (-not (Test-Path node_modules\bcryptjs)) { throw "Jalankan 'npm install' dulu." }

function Plain($s) {
  $b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }
}
$p1 = Plain (Read-Host "Kata sandi baru untuk $Email (10-72 karakter)" -AsSecureString)
$p2 = Plain (Read-Host "Ulangi kata sandi" -AsSecureString)
if ($p1 -ne $p2) { throw "Kedua isian tidak sama." }

$env:IRAMA_PASSWORD = $p1
try { $hash = (node tools/hash-password.mjs | Out-String).Trim() }
finally { Remove-Item Env:IRAMA_PASSWORD -ErrorAction SilentlyContinue }
if ($hash -notmatch '^\$2[aby]\$') { throw "Gagal membuat hash: $hash" }

$body = @{ secret = $cfg.APPS_SCRIPT_SECRET; email = $Email.Trim().ToLower(); action = "auth.setPassword"; payload = @{ hash = $hash } } | ConvertTo-Json -Depth 4
$r = Invoke-RestMethod -Uri $cfg.APPS_SCRIPT_URL -Method Post -ContentType "text/plain" -Body $body
if ($r.ok) { Write-Host "Kata sandi untuk $Email sudah diatur." -ForegroundColor Green }
else { throw "Gagal: $($r.message)" }
