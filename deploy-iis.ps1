#Requires -RunAsAdministrator
# 以系統管理員身分執行：建立 IIS 站台，直接指向這個資料夾
param(
  [string]$SiteName = 'DressUp',
  [int]$Port = 8080,
  [switch]$OpenFirewall   # 平板要從區網連進來時加上這個開關
)
$ErrorActionPreference = 'Stop'
$path = $PSScriptRoot
$appcmd = Join-Path $env:windir 'system32\inetsrv\appcmd.exe'

if (-not (Test-Path (Join-Path $path 'index.html'))) { throw "找不到 $path\index.html，請先在 src 執行 node build.js" }

# 站台已存在就只更新路徑與連接埠
$exists = (& $appcmd list site /name:$SiteName) 2>$null
if ($exists) {
  & $appcmd set site /site.name:$SiteName "/bindings:http/*:${Port}:" | Out-Null
  & $appcmd set vdir "/vdir.name:$SiteName/" "/physicalPath:$path" | Out-Null
  Write-Host "已更新站台 $SiteName"
} else {
  & $appcmd add apppool /name:$SiteName /managedRuntimeVersion: | Out-Null
  & $appcmd add site /name:$SiteName /bindings:http/*:${Port}: "/physicalPath:$path" | Out-Null
  & $appcmd set app "$SiteName/" /applicationPool:$SiteName | Out-Null
  Write-Host "已建立站台 $SiteName"
}

# 讓 IIS 讀得到資料夾（唯讀）
& icacls $path /grant "IIS_IUSRS:(OI)(CI)RX" "IUSR:(OI)(CI)RX" /T | Out-Null

if ($OpenFirewall) {
  if (-not (Get-NetFirewallRule -DisplayName "DressUp $Port" -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName "DressUp $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow | Out-Null
  }
  Write-Host "已開放防火牆 TCP $Port"
}

& $appcmd start site /site.name:$SiteName | Out-Null
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^(127|169)' } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "完成！本機：http://localhost:$Port/"
if ($ip) { Write-Host "平板（同一個 Wi-Fi）：http://${ip}:$Port/" }
