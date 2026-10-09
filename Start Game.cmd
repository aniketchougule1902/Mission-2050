@echo off
cd /d "%~dp0"
set "MISSION_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "MISSION_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo Open http://127.0.0.1:4185 after the server starts.
echo Keep this window open while playing. Ctrl+C stops the server.
"%MISSION_NODE%" dev.mjs
pause
