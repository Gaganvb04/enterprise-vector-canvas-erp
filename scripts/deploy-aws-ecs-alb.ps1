# AWS ECS Fargate & ALB Deployment Pipeline Script for Rooted Memoirs Studio
# IMPORTANT: This script MUST use AWS profile "rooted-memoirs" and account 736530791495
# Usage: .\scripts\deploy-aws-ecs-alb.ps1 [-Profile "rooted-memoirs"] [-AWSRegion "us-east-1"] [-VpcId "vpc-xxx"] [-SubnetIds "subnet-aaa,subnet-bbb"]

param (
    [Parameter(Mandatory=$false)]
    [string]$Profile = "rooted-memoirs",
    
    [Parameter(Mandatory=$false)]
    [string]$AWSRegion = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ExpectedAccount = "736530791495",
    
    [string]$VpcId = "",
    [string]$SubnetIds = "",
    [string]$StackName = "rooted-memoirs-production"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "[INFO] Rooted Memoirs Studio - ECS & ALB Deployment" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Cyan
Write-Host "Region: $AWSRegion" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProfileArg = @("--profile", $Profile)

# SECURITY GUARD: Verify AWS Account and Region
Write-Host "[SECURITY] Verifying AWS Account and Region..." -ForegroundColor Yellow

try {
    $IdentityJson = aws sts get-caller-identity @ProfileArg --output json 2>$null | ConvertFrom-Json
    
    if (-not $IdentityJson) {
        Write-Host "[ERROR] Failed to get AWS account identity using profile '$Profile'" -ForegroundColor Red
        Write-Host "[ERROR] Please configure the profile: aws configure --profile $Profile" -ForegroundColor Red
        exit 1
    }
    
    $AWSAccountId = $IdentityJson.Account
    $Arn = $IdentityJson.Arn
    
    if ($AWSAccountId -ne $ExpectedAccount) {
        Write-Host "[ERROR] AWS Account Mismatch!" -ForegroundColor Red
        Write-Host "[ERROR] Expected: $ExpectedAccount (Rooted Memoirs Studio)" -ForegroundColor Red
        Write-Host "[ERROR] Actual:   $AWSAccountId" -ForegroundColor Red
        Write-Host "[ERROR] Current Identity: $Arn" -ForegroundColor Red
        Write-Host "[ERROR] Deployment BLOCKED for safety." -ForegroundColor Red
        exit 1
    }
    
    $CurrentRegion = aws configure get region --profile $Profile 2>$null
    if ($CurrentRegion -and $CurrentRegion -ne $AWSRegion) {
        Write-Host "[WARN] Profile region ($CurrentRegion) differs from --region $AWSRegion" -ForegroundColor Yellow
        Write-Host "[INFO] Using explicit --region $AWSRegion for all commands" -ForegroundColor Yellow
    }

    Write-Host "[OK] AWS Account verified: $AWSAccountId" -ForegroundColor Green
    Write-Host "[OK] AWS Identity: $Arn" -ForegroundColor Green
    Write-Host "[OK] AWS Region: $AWSRegion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] AWS account verification failed: $_" -ForegroundColor Red
    exit 1
}

# Step 1: Auto-detect VPC ID if not provided
if (-not $VpcId) {
    Write-Host "[STEP 1] Auto-detecting Default VPC in $AWSRegion..." -ForegroundColor Yellow
    try {
        $VpcRaw = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --profile $Profile --region $AWSRegion --output json | ConvertFrom-Json
        if ($VpcRaw.Vpcs -and $VpcRaw.Vpcs.Count -gt 0) {
            $VpcId = $VpcRaw.Vpcs[0].VpcId
            Write-Host "[SUCCESS] Selected Default VPC: $VpcId" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Auto-detecting VPC failed: $_" -ForegroundColor Yellow
    }
}

# Step 2: Auto-detect Subnet IDs if not provided
if (-not $SubnetIds) {
    Write-Host "[STEP 2] Auto-detecting Subnets in VPC $VpcId..." -ForegroundColor Yellow
    try {
        $SubnetsRaw = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VpcId" --profile $Profile --region $AWSRegion --output json | ConvertFrom-Json
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

# Step 3: Register Standalone ECS Task Definitions (Optional)
Write-Host "[STEP 3] Registering ECS Task Definitions..." -ForegroundColor Yellow

if (Test-Path "aws-ecs-task-api.json") {
    Write-Host "  -> Registering API Gateway Task Definition..." -ForegroundColor Gray
    aws ecs register-task-definition --cli-input-json "file://aws-ecs-task-api.json" --profile $Profile --region $AWSRegion 2>$null
}

if (Test-Path "aws-ecs-task-studio.json") {
    Write-Host "  -> Registering Designer Studio Task Definition..." -ForegroundColor Gray
    aws ecs register-task-definition --cli-input-json "file://aws-ecs-task-studio.json" --profile $Profile --region $AWSRegion 2>$null
}

# Step 4: Deploy CloudFormation Stack
Write-Host "[STEP 4] Deploying ECS & ALB CloudFormation Stack ($StackName)..." -ForegroundColor Yellow

$ApiImageUri = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com/vcm-api-gateway:latest"
$StudioImageUri = "$AWSAccountId.dkr.ecr.$AWSRegion.amazonaws.com/vcm-designer-studio:latest"

aws cloudformation deploy --template-file aws-ecs-alb-cloudformation.yml --stack-name $StackName --parameter-overrides VpcId=$VpcId SubnetIds=$SubnetIds ApiImageUri=$ApiImageUri StudioImageUri=$StudioImageUri --capabilities CAPABILITY_NAMED_IAM --profile $Profile --region $AWSRegion

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] ECS Cluster & ALB Stack Deployed Successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green

    try {
        $OutputsRaw = aws cloudformation describe-stacks --stack-name $StackName --profile $Profile --region $AWSRegion --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
        foreach ($OutItem in $OutputsRaw) {
            Write-Host "$($OutItem.OutputKey): $($OutItem.OutputValue)" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "[INFO] Stack deployed. Check AWS Console for outputs." -ForegroundColor Gray
    }
} else {
    Write-Host "[ERROR] CloudFormation deployment exited with code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
