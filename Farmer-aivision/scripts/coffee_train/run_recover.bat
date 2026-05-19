@echo off
REM Recovery pipeline:
REM  1. Generate disease classifier JSON from existing .pt
REM  2. Train severity classifier (~30 min)
REM  3. Swap weights + update .env
REM
REM Run after killing the stuck run_all.bat.

setlocal enabledelayedexpansion
cd /d "%~dp0..\..\"

if not exist "logs\coffee_train" mkdir "logs\coffee_train"
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TS=%dt:~0,8%_%dt:~8,6%"
set "LOG=logs\coffee_train\recover_%TS%.log"

echo. > "%LOG%"
echo Recovery start %DATE% %TIME% >> "%LOG%"

call :step "1of3 Generate disease JSON" "scripts\coffee_train\recover_disease_json.py" || goto :fail
call :step "2of3 Train severity (30 min)" "scripts\coffee_train\06_train_resnet_severity.py" || goto :fail
call :step "3of3 Swap weights" "scripts\coffee_train\07_export_and_swap.py" || goto :fail

echo ALL DONE %DATE% %TIME% >> "%LOG%"
echo.
echo ============================================================
echo  ALL DONE. Log: %LOG%
echo  Restart FastAPI: python -m app
echo ============================================================
exit /b 0

:step
echo. >> "%LOG%"
echo [%DATE% %TIME%] STEP %~1 >> "%LOG%"
echo COMMAND: python -u %~2 >> "%LOG%"
echo.
echo [%DATE% %TIME%] STEP %~1
echo COMMAND: python -u %~2
echo Log: %LOG%
python -u %~2 >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [FAIL] step %~1 >> "%LOG%"
  echo [FAIL] step %~1
  exit /b 1
)
echo [OK] step %~1 - %DATE% %TIME% >> "%LOG%"
echo [OK] step %~1 - %DATE% %TIME%
exit /b 0

:fail
echo FAILED at %DATE% %TIME% >> "%LOG%"
echo.
echo ============================================================
echo  FAILED. See log: %LOG%
echo ============================================================
exit /b 1
