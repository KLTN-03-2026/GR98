@echo off
REM ============================================================
REM Train 3 models sequentially + swap weights.
REM Each step runs only if previous succeeded.
REM Estimated total: 4-5 hours on RTX 4060.
REM ============================================================
setlocal enabledelayedexpansion

REM Change to project root (this script is at scripts\coffee_train\)
cd /d "%~dp0..\..\"

REM Create logs folder
if not exist "logs\coffee_train" mkdir "logs\coffee_train"

REM Timestamp for log file
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TS=%dt:~0,8%_%dt:~8,6%"
set "LOG=logs\coffee_train\run_%TS%.log"

echo. > "%LOG%"
echo ============================================================ >> "%LOG%"
echo Coffee training pipeline - start %DATE% %TIME% >> "%LOG%"
echo ============================================================ >> "%LOG%"

call :step "1of4 YOLO detection" "scripts\coffee_train\04_train_yolo.py" || goto :fail
call :step "2of4 ResNet disease" "scripts\coffee_train\05_train_resnet_disease.py" || goto :fail
call :step "3of4 ResNet severity" "scripts\coffee_train\06_train_resnet_severity.py" || goto :fail
call :step "4of4 Swap weights" "scripts\coffee_train\07_export_and_swap.py" || goto :fail

echo. >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo ALL DONE - finished %DATE% %TIME% >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo.
echo ============================================================
echo ALL DONE. Log: %LOG%
echo Restart FastAPI: python -m app
echo ============================================================
exit /b 0

:step
echo. >> "%LOG%"
echo ------------------------------------------------------------ >> "%LOG%"
echo [%DATE% %TIME%] STEP %~1 >> "%LOG%"
echo COMMAND: python %~2 >> "%LOG%"
echo ------------------------------------------------------------ >> "%LOG%"
echo.
echo [%DATE% %TIME%] STEP %~1
echo COMMAND: python %~2
echo Log file: %LOG%
echo.
python %~2 >> "%LOG%" 2>&1
if errorlevel 1 (
  echo [FAIL] step %~1 - exit code %errorlevel% >> "%LOG%"
  echo [FAIL] step %~1 - exit code %errorlevel%
  exit /b 1
)
echo [OK] step %~1 - %DATE% %TIME% >> "%LOG%"
echo [OK] step %~1 - %DATE% %TIME%
exit /b 0

:fail
echo. >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo FAILED at %DATE% %TIME% - check log >> "%LOG%"
echo ============================================================ >> "%LOG%"
echo.
echo ============================================================
echo FAILED. See log: %LOG%
echo ============================================================
exit /b 1
