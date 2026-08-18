# Konfigurasi IP Statis untuk adaptor Wi-Fi HadirTadz
# Dijalankan sebagai Administrator (UAC).
$adapter = 'Wi-Fi'
$ip = '192.168.1.53'
$prefix = 24
$gateway = '192.168.1.1'
$dns = '192.168.1.1'

Write-Host '==> Mengosongkan konfigurasi IP lama (DHCP) pada Wi-Fi...' -ForegroundColor Cyan
try {
    Remove-NetIPAddress -InterfaceAlias $adapter -IPAddress $ip -Confirm:$false -ErrorAction SilentlyContinue
    Remove-NetRoute -InterfaceAlias $adapter -DestinationPrefix $gateway/32 -Confirm:$false -ErrorAction SilentlyContinue
    Remove-NetRoute -InterfaceAlias $adapter -DestinationPrefix '0.0.0.0/0' -Confirm:$false -ErrorAction SilentlyContinue
    Set-NetIPInterface -InterfaceAlias $adapter -Dhcp Disabled -ErrorAction SilentlyContinue
    Set-DnsClientServerAddress -InterfaceAlias $adapter -ResetServerAddresses -ErrorAction SilentlyContinue
} catch { Write-Host "Warning reset: $($_.Exception.Message)" -ForegroundColor Yellow }

Write-Host "==> Mengatur IP statis $ip/$prefix (GW $gateway)..." -ForegroundColor Cyan
try {
    New-NetIPAddress -InterfaceAlias $adapter -IPAddress $ip -PrefixLength $prefix -DefaultGateway $gateway -Confirm:$false | Out-Null
    Write-Host '  IP address OK' -ForegroundColor Green
} catch {
    Write-Host "Gagal set IP (mungkin sudah ada): $($_.Exception.Message)" -ForegroundColor Yellow
    Set-NetIPAddress -InterfaceAlias $adapter -IPAddress $ip -PrefixLength $prefix -DefaultGateway $gateway -Confirm:$false | Out-Null
}

Write-Host '==> Mengatur DNS statis...' -ForegroundColor Cyan
Set-DnsClientServerAddress -InterfaceAlias $adapter -ServerAddresses $dns | Out-Null
Write-Host "  DNS $dns OK" -ForegroundColor Green

Start-Sleep -Seconds 2
Write-Host ''
Write-Host '==> Hasil:' -ForegroundColor Cyan
Get-NetIPAddress -InterfaceAlias $adapter -AddressFamily IPv4 | Select-Object IPAddress, PrefixLength, AddressState
Get-NetIPConfiguration -InterfaceAlias $adapter | Select-Object @{n='GW';e={$_.IPv4DefaultGateway.NextHop}}, @{n='DNS';e={($_.DNSServer.ServerAddresses) -join ','}}

Write-Host ''
Write-Host 'Selesai. IP tetap 192.168.1.53/24.' -ForegroundColor Green
Write-Host 'Jika ingin kembali ke DHCP, jalankan script revert-static-ip.ps1' -ForegroundColor Yellow