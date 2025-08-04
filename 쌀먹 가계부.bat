@echo off
chcp 65001 > nul
title 메이플 쌀먹 가계부

echo.
echo =======================================
echo   메이플 쌀먹 가계부 실행 중...
echo =======================================
echo.

:: 현재 디렉토리로 이동
cd /d "%~dp0"

:: 브라우저에서 index.html 열기
start "" "index.html"

echo.
echo 브라우저에서 메이플 쌀먹 가계부가 열렸습니다!
echo.
echo 이 창은 3초 후 자동으로 닫힙니다...
timeout /t 3 /nobreak > nul

exit