$ErrorActionPreference = 'Stop'

$Source  = $PSScriptRoot
$DestDir = 'C:\laragon\www'
$Dest    = Join-Path $DestDir 'absensi_digital-sumber.zip'
$Stamp   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$ExcludedDirs     = @('node_modules', '.next', '.git', '.idea', '.vercel', '.expo', 'uploads')
$ExcludedPatterns = @('*.log', '*.tsbuildinfo')

function Test-ExcludedFile([System.IO.FileInfo]$File) {
    $leaf = $File.Name
    if ($leaf -eq '.env.example') { return $false }
    if ($leaf -like '.env*')     { return $true }
    foreach ($p in $ExcludedPatterns) {
        if ($leaf -like $p) { return $true }
    }
    return $false
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$all = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
function Add-Files($dir) {
    foreach ($item in Get-ChildItem -LiteralPath $dir.FullName -Force) {
        if ($item.PSIsContainer) {
            if ($ExcludedDirs -notcontains $item.Name) { Add-Files $item }
        }
        else {
            if (-not (Test-ExcludedFile $item)) { $all.Add($item) }
        }
    }
}
Add-Files (Get-Item -LiteralPath $Source)

if (-not (Test-Path -LiteralPath $DestDir)) { New-Item -ItemType Directory -Path $DestDir | Out-Null }
if (Test-Path -LiteralPath $Dest) { Remove-Item -LiteralPath $Dest -Force }

$zip = [System.IO.Compression.ZipFile]::Open($Dest, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($f in $all) {
        $rel = $f.FullName.Substring($Source.Length + 1) -replace '\\', '/'
        $null = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $f.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
    }
}
finally {
    $zip.Dispose()
}

$sizeMB = [math]::Round((Get-Item -LiteralPath $Dest).Length / 1MB, 2)
Write-Host ""
Write-Host "ZIP sumber berhasil dibuat."
Write-Host "  File  : $Dest"
Write-Host "  Waktu : $Stamp"
Write-Host "  Isi   : $($all.Count) file, $sizeMB MB"
Write-Host "  Keterangan: node_modules, .next, .git, .env rahasia TIDAK ikut."
Write-Host "  (hanya .env.example ikut supaya pembaca tahu konfigurasi)"