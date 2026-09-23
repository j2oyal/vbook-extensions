@echo off
cls
echo ====================================================
echo    vBook Extensions - Commit and Push to GitHub
echo    Target: https://github.com/j2oyal/vbook-extensions
echo ====================================================
echo.
cd /d "%~dp0"

:: Dam bao remote origin tro dung j2oyal
git remote set-url origin https://github.com/j2oyal/vbook-extensions.git >nul 2>&1

echo [1/4] Danh sach cac file thay doi:
echo ----------------------------------------------------
git status -s
echo ----------------------------------------------------
echo.

set "msg="
set /p msg="Nhap commit message (nhan Enter de lay mac dinh): "

if "%msg%"=="" set "msg=Update vBook extensions: %DATE% %TIME%"
if "%msg%"==" " set "msg=Update vBook extensions: %DATE% %TIME%"

echo.
echo [2/4] Dang add cac file (git add)...
git add .

echo.
echo [3/4] Dang commit: "%msg%"...
git commit -m "%msg%"

echo.
echo [4/4] Dang push len origin master...
git push -u origin master

if errorlevel 1 (
    echo.
    echo ====================================================
    echo    LOI: Push that bai!
    echo    Vui long kiem tra quyen truy cap GitHub.
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo    THANH CONG! Da day code len GitHub:
    echo    https://github.com/j2oyal/vbook-extensions
    echo ====================================================
)

echo.
pause
