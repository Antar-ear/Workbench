@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo First run: installing, please wait...
  call npm install
)
echo Starting the Workbench. Open http://workbench.local:3000 in your browser.
echo (If that link does not work, http://localhost:3000 still does.)
echo Leave this window open. Close it to stop.
call npm run dev
pause
