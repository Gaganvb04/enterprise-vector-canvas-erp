# AWS ECS Fargate & ALB Deployment Pipeline Script for Vector Canvas Platform
# Usage: .\scripts\deploy-aws-ecs-alb.ps1 [-Profile "studio"] [-AWSRegion "us-east-1"] [-VpcId "vpc-xxx"] [-SubnetIds "subnet-aaa,subnet-bbb"]

param (
    [string]$Profile = "",
    [string]$AWSRegion = "us-east-1",
    [string]$VpcId = "",
    [string]$SubnetIds = "",
    [string]$StackName = "vcm-ecs-alb-stack"
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[INFO] AWS ECS (Fargate) & ALB Infrastructure Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProfileArg = @()
if ($Profile) {
    $ProfileArg = @("--profile", $Profile)
}

# Step 1: Get Active AWS Account & Identity
Write-Host "[STEP 1] Verifying AWS CLI Identity..." -ForegroundColor Yellow
try {
    $IdentityJson = aws sts get-caller-identity @ProfileArg --output json | ConvertFrom-Json
    $AWSAccountId = $IdentityJson.Account
    $Arn = $IdentityJson.Arn

    Write-Host "[SUCCESS] Connected as AWS User/Role: $Arn" -ForegroundColor Green
    Write-Host "[SUCCESS] Target AWS Account ID: $AWSAccountId" -ForegroundColor Green
    Write-Host "[SUCCESS] Region: $AWSRegion" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Could not verify caller identity: $_" -ForegroundColor Yellow
}

# Step 2: Auto-detect VPC ID if not provided
if (-not $VpcId) {
    Write-Host "[STEP 2] Auto-detecting Default VPC in $AWSRegion..." -ForegroundColor Yellow
    try {
        $VpcRaw = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --region $AWSRegion @ProfileArg --output json | ConvertFrom-Json
        if ($VpcRaw.Vpcs -and $VpcRaw.Vpcs.Count -gt 0) {
            $VpcId = $VpcRaw.Vpcs[0].VpcId
            Write-Host "[SUCCESS] Selected Default VPC: $VpcId" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Auto-detecting VPC failed: $_" -ForegroundColor Yellow
    }
}

# Step 3: Auto-detect Subnet IDs if not provided
if (-not $SubnetIds) {
    Write-Host "[STEP 3] Auto-detecting Subnets in VPC $VpcId..." -ForegroundColor Yellow
    try {
        $SubnetsRaw = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --region $AWSRegion @ProfileArg --output json | ConvertFrom-Json
        if ($SubnetsRaw.Subnets -and $SubnetsRaw.Subnets.Count -ge 2) {
            $Subnet1 = $SubnetsRaw.Subnets[0].SubnetId
            $Subnet2 = $SubnetsRaw.Subnets[1].SubnetId
            $SubnetIds = "$Subnet1,$Subnet2"
            Write-Host "[SUCCESS] Selected Subnets: $SubnetIds" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Auto-detecting subnets failed: $_" -ForegroundColor Yellow
    }
}

# Step 4: Register Standalone ECS Task Definitions (Optional)
Write-Host "[STEP 4] Registering ECS Task Definitions..." -ForegroundColor Yellow

if (Test-Path "aws-ecs-task-api.json") {
    Write-Host "  -> Registering API Gateway Task Definition..." -ForegroundColor Gray
    aws ecs register-task-definition --cli-input-json "file://aws-ecs-task-api.json" --region $AWSRegion @ProfileArg 2>$null
}

if (Test-Path "aws-ecs-task-studio.json") {
    Write-Host "  -> Registering Designer Studio Task Definition..." -ForegroundColor Gray
    aws ecs register-task-definition --cli-input-json "file://aws-ecs-task-studio.json" --region $AWSRegion @ProfileArg 2>$null
}

# Step 5: Deploy CloudFormation Stack
Write-Host "[STEP 5] Deploying ECS & ALB CloudFormation Stack ($StackName)..." -ForegroundColor Yellow

$ApiImageUri = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com/vcm-api-gateway:latest"
$StudioImageUri = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com/vcm-designer-studio:latest"

aws cloudformation deploy --template-file aws-ecs-alb-cloudformation.yml --stack-name $StackName --parameter-overrides VpcId=$VpcId SubnetIds=$SubnetIds ApiImageUri=$ApiImageUri StudioImageUri=$StudioImageUri --capabilities CAPABILITY_NAMED_IAM --region $AWSRegion @ProfileArg

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] ECS Cluster & ALB Stack Deployed Successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green

    try {
        $OutputsRaw = aws cloudformation describe-stacks --stack-name $StackName --region $AWSRegion @ProfileArg --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
        foreach ($OutItem in $OutputsRaw) {
            Write-Host "$($OutItem.OutputKey): $($OutItem.OutputValue)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "[INFO] Stack deployed. Check AWS Console for outputs." -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] CloudFormation deployment exited with code $LASTEXITCODE" -ForegroundColor Red
}
