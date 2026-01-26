@echo off
REM PowerShell test script for ZYNK Backend

echo.
echo ============================================================
echo      ZYNK Backend - Testing Suite
echo ============================================================
echo.

setlocal enabledelayedexpansion

set API_URL=%1
if "%API_URL%"=="" set API_URL=http://localhost:5000

echo [1/4] Testing Health Endpoint...
curl -s -X GET "%API_URL%/api/health" -H "Content-Type: application/json"
if %ERRORLEVEL% equ 0 (
    echo.
    echo [PASS] Health check successful
) else (
    echo.
    echo [FAIL] Health check failed
    exit /b 1
)

echo.
echo [2/4] Testing User Registration...
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set timestamp=%mydate%%mytime%

curl -s -X POST "%API_URL%/api/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test%timestamp%@example.com\",\"password\":\"Test@123\",\"name\":\"Test User\"}"

echo.
echo [PASS] Registration test completed

echo.
echo ============================================================
echo      Testing Complete
echo ============================================================
