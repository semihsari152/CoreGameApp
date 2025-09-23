@echo off
echo CoreGameApp Frontend Başlatılıyor...
echo.

cd WebLayer\ClientApp

echo 1. Bağımlılıklar yükleniyor...
call npm install
if %errorlevel% neq 0 (
    echo Hata: Bağımlılıklar yüklenemedi!
    pause
    exit /b 1
)

echo.
echo 2. Frontend başlatılıyor...
call npm start

pause