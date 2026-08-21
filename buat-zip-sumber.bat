@echo off
chcp 65001 >nul
title Buat ZIP Sumber Absensi Digital
echo Membuat ZIP kode sumber (tanpa node_modules / .next / .git / .env)...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0buat-zip-sumber.ps1"
echo.
echo ============================================================
echo   Klik 2x file ini lagi setiap kali selesai mengubah kode,
echo   supaya ZIP terbaru selalu tersedia di C:\laragon\www
echo ============================================================
echo.
pause