@echo off
set "NODE22=C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2"
set "PATH=%NODE22%;%PATH%"
cd /d "%~dp0.."
node "node_modules\next\dist\bin\next" dev
