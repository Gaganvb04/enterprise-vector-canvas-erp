# AWS ECR Docker Build & Push Script for Vector Canvas Platform
# Usage: .\scripts\deploy-aws-ecr.ps1 -AWSAccountId "736530791495" -AWSRegion "us-east-1"

param (
    [Parameter(Mandatory=$true)]
    [string]$AWSAccountId,
    
    [string]$AWSRegion = "us-east-1"
)

$ErrorActionPreference = "Continue"

$ECR_REGISTRY = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com"
$API_REPO = "vcm-api-gateway"
$STUDIO_REPO = "vcm-designer-studio"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[INFO] AWS ECR Container Build & Push Pipeline" -ForegroundColor Cyan
Write-Host "Registry: $ECR_REGISTRY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: AWS ECR Login
Write-Host "[STEP 1] Logging into AWS ECR..." -ForegroundColor Yellow
aws ecr get-login-password --region $AWSRegion | docker login --username AWS --password-stdin $ECR_REGISTRY

# Step 2: Create ECR Repositories if they don't exist
Write-Host "[STEP 2] Ensuring ECR Repositories Exist..." -ForegroundColor Yellow

$CheckApi = aws ecr describe-repositories --repository-names $API_REPO --region $AWSRegion 2>$null
if (-not $CheckApi) {
    Write-Host "  -> Creating ECR Repository: $API_REPO" -ForegroundColor Gray
    aws ecr create-repository --repository-name $API_REPO --region $AWSRegion
}

$CheckStudio = aws ecr describe-repositories --repository-names $STUDIO_REPO --region $AWSRegion 2>$null
if (-not $CheckStudio) {
    Write-Host "  -> Creating ECR Repository: $STUDIO_REPO" -ForegroundColor Gray
    aws ecr create-repository --repository-name $STUDIO_REPO --region $AWSRegion
}

# Step 3: Build Docker Images
Write-Host "[STEP 3] Building Docker Image for API Gateway..." -ForegroundColor Yellow
docker build -t $API_REPO -f apps/api-gateway/Dockerfile apps/api-gateway

Write-Host "[STEP 3] Building Docker Image for Designer Studio..." -ForegroundColor Yellow
docker build -t $STUDIO_REPO -f apps/designer-studio/Dockerfile apps/designer-studio

# Step 4: Tag Images for AWS ECR
Write-Host "[STEP 4] Tagging Container Images for ECR..." -ForegroundColor Yellow
docker tag "${API_REPO}:latest" "${ECR_REGISTRY}/${API_REPO}:latest"
docker tag "${STUDIO_REPO}:latest" "${ECR_REGISTRY}/${STUDIO_REPO}:latest"

# Step 5: Push to ECR
Write-Host "[STEP 5] Pushing API Gateway Image to AWS ECR..." -ForegroundColor Green
docker push "${ECR_REGISTRY}/${API_REPO}:latest"

Write-Host "[STEP 5] Pushing Designer Studio Image to AWS ECR..." -ForegroundColor Green
docker push "${ECR_REGISTRY}/${STUDIO_REPO}:latest"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "[SUCCESS] Pushed container images to AWS ECR!" -ForegroundColor Green
Write-Host "API Gateway Image: ${ECR_REGISTRY}/${API_REPO}:latest" -ForegroundColor Green
Write-Host "Designer Studio Image: ${ECR_REGISTRY}/${STUDIO_REPO}:latest" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
