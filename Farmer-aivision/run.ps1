# agri-ai-service.ps1 - PowerShell task runner (thay the Makefile tren Windows)

param(
    [ValidateSet("run", "dev", "install", "docker-build", "docker", "docker-stop", "test", "help")]
    [string]$Action = "help"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Msg)
    Write-Host "[INFO] $Msg" -ForegroundColor Cyan
}

switch ($Action) {
    "run" {
        Write-Step "Starting uvicorn server..."
        uvicorn app.main:app --host 0.0.0.0 --port 8000
    }
    "dev" {
        Write-Step "Starting uvicorn with auto-reload..."
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    }
    "install" {
        Write-Step "Installing dependencies..."
        pip install -r requirements.txt
    }
    "install-train" {
        Write-Step "Installing training dependencies..."
        pip install -r requirements-train.txt
    }
    "docker-build" {
        Write-Step "Building Docker image..."
        docker build -t agri-ai-service .
    }
    "docker" {
        Write-Step "Running Docker container..."
        $volume = "$PSScriptRoot\ai\weights:C:\app\ai\weights"
        docker run -d -p 8000:8000 --name agri-ai -v $volume agri-ai-service
        Write-Host "[OK] Container started. API: http://localhost:8000/docs" -ForegroundColor Green
    }
    "docker-stop" {
        Write-Step "Stopping and removing container..."
        docker stop agri-ai 2>$null
        docker rm agri-ai 2>$null
        Write-Host "[OK] Container removed." -ForegroundColor Green
    }
    "test" {
        Write-Step "Running tests..."
        pytest -v
    }
    "help" {
        Write-Host @"
Available actions:
  .\run.ps1 run           - Start uvicorn server
  .\run.ps1 dev           - Start uvicorn with auto-reload
  .\run.ps1 install       - Install production dependencies
  .\run.ps1 install-train - Install + training dependencies
  .\run.ps1 docker-build  - Build Docker image
  .\run.ps1 docker         - Run Docker container
  .\run.ps1 docker-stop   - Stop and remove container
  .\run.ps1 test          - Run tests

"@
    }
}
