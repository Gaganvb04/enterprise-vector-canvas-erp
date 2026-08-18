# AWS ECR Docker Build & Push Script for Rooted Memoirs Studio
# IMPORTANT: This script MUST use AWS profile "rooted-memoirs" and account 736530791495
# Usage: .\scripts\deploy-aws-ecr.ps1 -AWSProfile "rooted-memoirs" -AWSAccountId "736530791495" -AWSRegion "us-east-1"

param (
    [Parameter(Mandatory=$false)]
    [string]$AWSProfile = "rooted-memoirs",
    
    [Parameter(Mandatory=$false)]
    [string]$AWSAccountId = "736530791495",
    
    [Parameter(Mandatory=$false)]
    [string]$AWSRegion = "us-east-1"
)

$ErrorActionPreference = "Stop"

$ECR_REGISTRY = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com"
$API_REPO = "vcm-api-gateway"
$STUDIO_REPO = "vcm-designer-studio"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[INFO] Rooted Memoirs Studio - AWS ECR Deployment" -ForegroundColor Cyan
Write-Host "Registry: $ECR_REGISTRY" -ForegroundColor Cyan
Write-Host "Profile: $AWSProfile" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# SECURITY GUARD: Verify AWS Account and Region
Write-Host "[SECURITY] Verifying AWS Account and Region..." -ForegroundColor Yellow

try {
    $CurrentAccount = aws sts get-caller-identity --profile $AWSProfile --query Account --output text 2>$null
    $CurrentRegion = aws configure get region --profile $AWSProfile 2>$null
    
    if (-not $CurrentAccount) {
        Write-Host "[ERROR] Failed to get AWS account identity using profile '$AWSProfile'" -ForegroundColor Red
        Write-Host "[ERROR] Please configure the profile: aws configure --profile $AWSProfile" -ForegroundColor Red
        exit 1
    }
    
    if ($CurrentAccount -ne $AWSAccountId) {
        Write-Host "[ERROR] AWS Account Mismatch!" -ForegroundColor Red
        Write-Host "[ERROR] Expected: $AWSAccountId (Rooted Memoirs Studio)" -ForegroundColor Red
        Write-Host "[ERROR] Actual:   $CurrentAccount" -ForegroundColor Red
        Write-Host "[ERROR] Deployment BLOCKED for safety." -ForegroundColor Red
        exit 1
    }
    
    if ($CurrentRegion -ne $AWSRegion) {
        Write-Host "[WARN] Region mismatch: Expected $AWSRegion, got $CurrentRegion" -ForegroundColor Yellow
        Write-Host "[INFO] Using --region $AWSRegion override for all commands" -ForegroundColor Yellow
    }
    
    Write-Host "[OK] AWS Account verified: $CurrentAccount" -ForegroundColor Green
    Write-Host "[OK] AWS Region: $AWSRegion" -ForegroundColor Green
    
} catch {
    Write-Host "[ERROR] AWS account verification failed: $_" -ForegroundColor Red
    exit 1
}

# Step 1: AWS ECR Login
Write-Host "[STEP 1] Logging into AWS ECR..." -ForegroundColor Yellow
aws ecr get-login-password --profile $AWSProfile --region $AWSRegion | docker login --username AWS --password-stdin $ECR_REGISTRY

# Step 2: Create ECR Repositories if they don't exist
Write-Host "[STEP 2] Ensuring ECR Repositories Exist..." -ForegroundColor Yellow

$CheckApi = aws ecr describe-repositories --repository-names $API_REPO --profile $AWSProfile --region $AWSRegion 2>$null
if (-not $CheckApi) {
    Write-Host "  -> Creating ECR Repository: $API_REPO" -ForegroundColor Gray
    aws ecr create-repository --repository-name $API_REPO --profile $AWSProfile --region $AWSRegion
}

$CheckStudio = aws ecr describe-repositories --repository-names $STUDIO_REPO --profile $AWSProfile --region $AWSRegion 2>$null
if (-not $CheckStudio) {
    Write-Host "  -> Creating ECR Repository: $STUDIO_REPO" -ForegroundColor Gray
    aws ecr create-repository --repository-name $STUDIO_REPO --profile $AWSProfile --region $AWSRegion
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
