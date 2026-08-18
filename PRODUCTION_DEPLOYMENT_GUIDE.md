# ROOTED MEMOIRS STUDIO — PRODUCTION DEPLOYMENT GUIDE

## CRITICAL SECURITY REQUIREMENTS

This guide outlines the **required** steps to deploy Rooted Memoirs Studio to AWS in a production-ready configuration.

---

## 1. AWS SECRETS MANAGER SETUP

### Required Secrets

Create the following secrets in AWS Secrets Manager **before** deploying:

#### JWT Secret
```bash
aws secretsmanager create-secret \
  --name prod/rooted-memoirs/jwt-secret \
  --description "JWT signing secret for Rooted Memoirs Studio" \
  --secret-string "$(openssl rand -base64 32)" \
  --profile rooted-memoirs \
  --region us-east-1
```

**ARN Format:**
```
arn:aws:secretsmanager:us-east-1:736530791495:secret:prod/rooted-memoirs/jwt-secret
```

#### Database URL
```bash
aws secretsmanager create-secret \
  --name prod/rooted-memoirs/database-url \
  --description "PostgreSQL connection string for Rooted Memoirs Studio" \
  --secret-string "postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/rootedmemories?schema=public" \
  --profile rooted-memoirs \
  --region us-east-1
```

**ARN Format:**
```
arn:aws:secretsmanager:us-east-1:736530791495:secret:prod/rooted-memoirs/database-url
```

**IMPORTANT:** Replace `DB_USER`, `DB_PASSWORD`, and `DB_HOST` with actual production database credentials.

---

## 2. IAM PERMISSIONS

### Task Execution Role

The ECS task execution role **must** have permission to retrieve secrets from AWS Secrets Manager.

The CloudFormation template (`aws-ecs-alb-cloudformation.yml`) includes this policy automatically:

```yaml
Policies:
  - PolicyName: SecretsManagerAccess
    PolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Action:
            - secretsmanager:GetSecretValue
          Resource:
            - !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:prod/rooted-memoirs/*'
```

If using an existing role, add this policy manually.

---

## 3. ECS TASK DEFINITION

The file `aws-ecs-task-api.json` contains the production task definition with secrets injection configured.

### Verify Secrets Configuration

```json
"secrets": [
  {
    "name": "JWT_SECRET",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:736530791495:secret:prod/rooted-memoirs/jwt-secret"
  },
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:736530791495:secret:prod/rooted-memoirs/database-url"
  }
]
```

These secrets will be injected as environment variables into the running container.

---

## 4. DATABASE SETUP

### Production Database Requirements

- **PostgreSQL 15+**
- Managed service recommended (AWS RDS)
- Enable automated backups
- Enable encryption at rest
- Configure secure VPC networking
- Use strong password (minimum 16 characters, random)

### Database Migration

After creating the production database, run Prisma migrations:

```bash
cd apps/api-gateway
npx prisma migrate deploy
```

This will create all required tables including:
- `PublishedTemplateRecord`
- `CustomerWorkflowSession`
- `CustomerSubmissionRecord`
- `ImmutableProductionSnapshotRecord`
- `WorkflowOrderRecord`
- Plus all inventory, orders, and catalog tables

### Seed Demo Data (Optional)

To populate demo templates for testing:

```bash
npx prisma db seed
```

---

## 5. HTTPS CONFIGURATION

### ACM Certificate

1. Request a certificate in AWS Certificate Manager (ACM):
```bash
aws acm request-certificate \
  --domain-name studio.rootedmemoirs.com \
  --validation-method DNS \
  --profile rooted-memoirs \
  --region us-east-1
```

2. Complete DNS validation by adding the CNAME record to your domain

3. Wait for certificate to be issued (status: ISSUED)

### CloudFormation Deployment with HTTPS

```bash
aws cloudformation create-stack \
  --stack-name rooted-memoirs-production \
  --template-body file://aws-ecs-alb-cloudformation.yml \
  --parameters \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=SubnetIds,ParameterValue="subnet-xxxxx\\,subnet-yyyyy" \
    ParameterKey=AcmCertificateArn,ParameterValue=arn:aws:acm:us-east-1:736530791495:certificate/xxxxx \
    ParameterKey=EnvironmentName,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile rooted-memoirs \
  --region us-east-1
```

**IMPORTANT:** Replace placeholder values:
- `vpc-xxxxx` with your VPC ID
- `subnet-xxxxx,subnet-yyyyy` with at least 2 public subnets in different AZs
- Certificate ARN with your actual ACM certificate ARN

The CloudFormation template will:
- Create HTTPS listener on port 443
- Redirect HTTP (80) to HTTPS (443)
- Configure ALB with your SSL certificate

---

## 6. DOCKER IMAGE BUILD & PUSH

### API Gateway

```bash
cd apps/api-gateway

# Build Docker image
docker build -t vcm-api-gateway:$(git rev-parse --short HEAD) .

# Tag for ECR
docker tag vcm-api-gateway:$(git rev-parse --short HEAD) \
  736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-api-gateway:$(git rev-parse --short HEAD)

# Login to ECR
aws ecr get-login-password --profile rooted-memoirs --region us-east-1 | \
  docker login --username AWS --password-stdin 736530791495.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push 736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-api-gateway:$(git rev-parse --short HEAD)

# Tag as latest
docker tag vcm-api-gateway:$(git rev-parse --short HEAD) \
  736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-api-gateway:latest

docker push 736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-api-gateway:latest
```

### Designer Studio (Frontend)

```bash
cd apps/designer-studio

# Build production frontend
npm run build

# Build Docker image
docker build -t vcm-designer-studio:$(git rev-parse --short HEAD) .

# Tag for ECR
docker tag vcm-designer-studio:$(git rev-parse --short HEAD) \
  736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-designer-studio:$(git rev-parse --short HEAD)

# Push to ECR
docker push 736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-designer-studio:$(git rev-parse --short HEAD)

# Tag as latest
docker tag vcm-designer-studio:$(git rev-parse --short HEAD) \
  736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-designer-studio:latest

docker push 736530791495.dkr.ecr.us-east-1.amazonaws.com/vcm-designer-studio:latest
```

---

## 7. ECS DEPLOYMENT

### Update Task Definition

```bash
aws ecs register-task-definition \
  --cli-input-json file://aws-ecs-task-api.json \
  --profile rooted-memoirs \
  --region us-east-1
```

### Update ECS Service

```bash
# API Gateway Service
aws ecs update-service \
  --cluster vcm-vector-platform-cluster \
  --service vcm-api-gateway-service \
  --force-new-deployment \
  --profile rooted-memoirs \
  --region us-east-1

# Designer Studio Service
aws ecs update-service \
  --cluster vcm-vector-platform-cluster \
  --service vcm-designer-studio-service \
  --force-new-deployment \
  --profile rooted-memoirs \
  --region us-east-1
```

### Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster vcm-vector-platform-cluster \
  --services vcm-api-gateway-service vcm-designer-studio-service \
  --profile rooted-memoirs \
  --region us-east-1

# Check task status
aws ecs list-tasks \
  --cluster vcm-vector-platform-cluster \
  --service-name vcm-api-gateway-service \
  --profile rooted-memoirs \
  --region us-east-1

# View logs
aws logs tail /ecs/vcm-vector-platform \
  --follow \
  --profile rooted-memoirs \
  --region us-east-1
```

---

## 8. POST-DEPLOYMENT VERIFICATION

### Health Check

```bash
# API Health
curl https://your-alb-domain.com/health

# Expected Response:
# {"status":"ok","timestamp":"2026-08-18T..."}
```

### Security Verification

#### 1. Verify JWT Secret is NOT Hardcoded

```bash
# Search source code
grep -r "your_super_secret_jwt_key_here" apps/api-gateway/src/
# Expected: No results

# Check running container
aws ecs describe-tasks \
  --cluster vcm-vector-platform-cluster \
  --tasks TASK_ARN \
  --profile rooted-memoirs \
  --region us-east-1 \
  | jq '.tasks[0].containers[0].environment'

# Expected: JWT_SECRET should NOT appear in environment array (it's in secrets array)
```

#### 2. Verify Database Password is NOT Hardcoded

```bash
# Search source code
grep -r "password123" apps/api-gateway/
# Expected: No results in source files

# Check docker-compose (should use env vars)
grep "POSTGRES_PASSWORD" apps/api-gateway/docker-compose.yml
# Expected: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set}
```

#### 3. Verify Prisma Migration Succeeded

```bash
# Connect to production database
psql $DATABASE_URL

# Check tables exist
\dt

# Expected tables:
# - PublishedTemplateRecord
# - CustomerWorkflowSession
# - CustomerSubmissionRecord
# - ImmutableProductionSnapshotRecord
# - WorkflowOrderRecord
```

#### 4. Test Customer Workflow Persistence

```bash
# Create a customer session
curl -X POST https://your-alb-domain.com/api/templates/session \
  -H "Content-Type: application/json" \
  -d '{"publicToken":"pub_tok_royal_floral_123"}'

# Save response sessionId

# Add customer data
curl -X PUT https://your-alb-domain.com/api/templates/session/pub_tok_royal_floral_123/data \
  -H "Content-Type: application/json" \
  -d '{"customerData":{"bride_name":"Test"}}'

# Restart the API container
aws ecs update-service \
  --cluster vcm-vector-platform-cluster \
  --service vcm-api-gateway-service \
  --force-new-deployment \
  --profile rooted-memoirs \
  --region us-east-1

# Wait for new task to be running

# Retrieve the session again
curl https://your-alb-domain.com/api/templates/session \
  -H "Content-Type: application/json" \
  -d '{"publicToken":"pub_tok_royal_floral_123"}'

# Expected: Customer data should still exist (retrieved from database)
```

#### 5. Test Immutable Snapshot

```bash
# Submit and approve a customer session
# ... (create session, submit, approve via API)

# Verify snapshot was created in database
psql $DATABASE_URL -c "SELECT * FROM \"ImmutableProductionSnapshotRecord\";"

# Expected: Snapshot with snapshotChecksum
```

---

## 9. SECURITY CHECKLIST

- [ ] JWT_SECRET stored in AWS Secrets Manager
- [ ] DATABASE_URL stored in AWS Secrets Manager
- [ ] ECS task definition uses secrets injection (not environment variables)
- [ ] Task execution role has SecretsManager:GetSecretValue permission
- [ ] No hardcoded secrets in source code
- [ ] No .env files committed to Git
- [ ] HTTPS configured with valid ACM certificate
- [ ] HTTP redirects to HTTPS
- [ ] PostgreSQL uses strong password (16+ chars, random)
- [ ] Database encryption at rest enabled
- [ ] Database automated backups enabled
- [ ] Customer workflow data persisted in PostgreSQL
- [ ] Immutable snapshots create SHA-256 checksums
- [ ] Server-side authorization validates customerEditableFields
- [ ] Approved sessions block customer mutations (IMMUTABLE_APPROVED_SESSION)

---

## 10. PRODUCTION RUNTIME BEHAVIOR

### JWT Secret

- **Development (NODE_ENV=development):**
  - If JWT_SECRET not set: Generates ephemeral random secret (logs warning)
  - Allows crypto.randomBytes fallback for local development

- **Production (NODE_ENV=production):**
  - If JWT_SECRET not set: **Application throws error and fails to start**
  - No fallback generation
  - Requires explicit secret from Secrets Manager

### Database Connection

- **All Environments:**
  - If DATABASE_URL not set: Prisma client throws error
  - No fallback or defaults
  - Requires explicit connection string

### Customer Workflow

- **All Environments:**
  - Data stored in PostgreSQL via Prisma
  - Session, submission, order, and snapshot data persist after container restart
  - No in-memory or ephemeral storage
  - Database is authoritative source of truth

---

## 11. TROUBLESHOOTING

### Secrets Not Injected

**Symptom:** Application fails with "JWT_SECRET is required in production"

**Solution:**
1. Verify secrets exist in Secrets Manager:
```bash
aws secretsmanager describe-secret \
  --secret-id prod/rooted-memoirs/jwt-secret \
  --profile rooted-memoirs \
  --region us-east-1
```

2. Verify task execution role has permission:
```bash
aws iam get-role-policy \
  --role-name vcm-ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --profile rooted-memoirs \
  --region us-east-1
```

3. Check ECS task logs:
```bash
aws logs tail /ecs/vcm-vector-platform \
  --follow \
  --profile rooted-memoirs \
  --region us-east-1
```

### Database Connection Failed

**Symptom:** "Can't reach database server"

**Solution:**
1. Verify DATABASE_URL format:
```
postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
```

2. Verify ECS tasks can reach database (security groups, VPC networking)

3. Verify database is running and accessible

### Customer Data Not Persisting

**Symptom:** Customer data disappears after container restart

**Solution:**
1. Verify Prisma migrations ran:
```bash
npx prisma migrate deploy
```

2. Check database contains customer workflow tables:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

3. Verify application uses Prisma (not in-memory stores):
```bash
grep -r "publishedTemplatesStore" apps/api-gateway/src/domains/templates/customer-workflow.routes.ts
# Expected: No results (removed)
```

---

## 12. MAINTENANCE

### Backup Strategy

- AWS RDS automated backups (daily)
- Retain backups for 30 days minimum
- Test restore procedure quarterly

### Monitoring

- CloudWatch logs for ECS tasks
- CloudWatch alarms for task failures
- ALB target health checks
- Database connection pool metrics

### Updates

- Keep dependencies updated (npm audit, Prisma updates)
- Rotate JWT secret annually
- Rotate database password quarterly
- Review IAM permissions quarterly

---

## PRODUCTION READINESS VERDICT

After completing all steps in this guide:

✅ **PRODUCTION READY** if:
- All security checklist items verified
- Secrets stored in AWS Secrets Manager
- HTTPS configured with valid certificate
- Customer workflow data persists after restart
- Immutable snapshots stored in database
- No hardcoded secrets in source or containers

❌ **NOT READY** if:
- Any security checklist item fails
- Secrets hardcoded or in environment variables
- HTTP-only deployment
- Customer data ephemeral (in-memory)
- Database migration not applied

---

**Last Updated:** 2026-08-18  
**Version:** 1.0  
**Commit:** Post-Production-Hardening
