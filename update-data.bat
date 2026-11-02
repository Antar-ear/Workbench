@echo off
cd /d "%~dp0"
echo Checking data\Workbench-Data.xlsx ...
echo.
call node scripts\build-data.mjs
echo.
echo (If it says "Data OK", refresh the Workbench in your browser.)
pause
