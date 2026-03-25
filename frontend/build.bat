@echo off
title Creator OS — Build
color 0A
echo.
echo  ==========================================
echo   Creator OS — Desktop App Builder v2
echo   SaaS Mode: Your keys, users just login
echo  ==========================================
echo.

:: ── IMPORTANT: Replace these before building! ─────────────────────────────
:: Edit electron/main.js and electron/login.html with your real keys first!
:: ──────────────────────────────────────────────────────────────────────────

:: ── Step 1: Bundle Backend with PyInstaller ───────────────────────────────
echo [1/4] Bundling Python backend...
cd /d F:\creator-os\backend

call venv\Scripts\activate

pip install pyinstaller --quiet

pyinstaller ^
  --onefile ^
  --name creator-os-backend ^
  --hidden-import uvicorn ^
  --hidden-import uvicorn.lifespan.on ^
  --hidden-import uvicorn.protocols.http.auto ^
  --hidden-import fastapi ^
  --hidden-import supabase ^
  --hidden-import groq ^
  --hidden-import google.auth ^
  --hidden-import googleapiclient ^
  --hidden-import tweepy ^
  --hidden-import apscheduler ^
  --hidden-import httpx ^
  --add-data "app;app" ^
  app/main.py

if %errorlevel% neq 0 (
  echo [ERROR] Backend build failed!
  pause & exit /b 1
)
echo [OK] Backend ready: backend\dist\creator-os-backend.exe


:: ── Step 2: Copy ffmpeg ───────────────────────────────────────────────────
echo.
echo [2/4] Checking ffmpeg...
if exist "F:\creator-os\backend\ffmpeg.exe" (
  echo [OK] ffmpeg.exe already in backend folder
) else (
  where ffmpeg >nul 2>&1
  if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('where ffmpeg') do (
      copy "%%i" "F:\creator-os\backend\ffmpeg.exe" >nul
      echo [OK] ffmpeg.exe copied from PATH
      goto ffmpeg_done
    )
  )
  echo [WARN] ffmpeg.exe not found!
  echo        Download from https://ffmpeg.org/download.html
  echo        Place ffmpeg.exe in F:\creator-os\backend\
  echo        Then re-run this script.
  pause
)
:ffmpeg_done


:: ── Step 3: Build React Frontend ──────────────────────────────────────────
echo.
echo [3/4] Building React frontend...
cd /d F:\creator-os\frontend

call npm install --silent
call npm run build

if %errorlevel% neq 0 (
  echo [ERROR] Frontend build failed!
  pause & exit /b 1
)
echo [OK] Frontend built: frontend\dist\


:: ── Step 4: Build Electron Installer ──────────────────────────────────────
echo.
echo [4/4] Packaging Electron installer...
call npm run electron:build:win

if %errorlevel% neq 0 (
  echo [ERROR] Electron packaging failed!
  pause & exit /b 1
)

echo.
echo  ==========================================
echo   BUILD COMPLETE!
echo.
echo   Installer: frontend\release\
echo   Share:     Creator-OS-Setup.exe
echo.
echo   Users:
echo     1. Download + install .exe
echo     2. Sign up with email
echo     3. Use Creator OS immediately
echo        (no API keys needed from them!)
echo  ==========================================
echo.
explorer F:\creator-os\frontend\release
pause