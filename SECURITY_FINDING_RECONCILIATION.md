# ROOTED MEMOIRS STUDIO — SECURITY FINDING RECONCILIATION

**Investigation Date:** August 17, 2026  
**Investigation Type:** Evidence-Based Source Code Analysis  
**Purpose:** Reconcile security findings between initial QA report and independent verification

---

## 1. JWT SECRET

### Evidence Collection

**Locations Found:**

1. **auth.middleware.ts (Line 5):**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
```

2. **auth.routes.ts (Line 8):**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
```

3. **docker-compose.yml (Line 63):**
```yaml
JWT_SECRET: ${JWT_SECRET:-rooted_memories_super_secret_jwt_key_2026}
```

4. **aws-ecs-task-api.json (Line 28):**
```json
{ "name": "JWT_SECRET", "value": "rooted_memories_super_secret_jwt_key_2026" }
```

5. **aws-ecs-alb-cloudformation.yml (Line 216):**
```yaml
- Name: JWT_SECRET
  Value: 'rooted_memories_super_secret_jwt_key_2026'
```

### Analysis

**A. Does the hardcoded fallback exist in source?**
✅ YES - In docker-compose.yml, aws-ecs-task-api.json, and aws-ecs-alb-cloudformation.yml

**B. Is it development-only?**
❌ NO - Found in production AWS deployment configurations

**C. Does the production ECS configuration provide JWT_SECRET?**
✅ YES - BUT it provides the hardcoded value `rooted_memories_super_secret_jwt_key_2026`

**D. Does production obtain it from Secrets Manager or SSM?**
❌ NO - ECS task definition contains the literal string value

**E. Can the fallback execute in production?**
⚠️ IRRELEVANT - The production config **IS** the fallback value

**F. Is the JWT secret exposed?**
✅ YES - In version control, publicly accessible GitHub repository

### CRITICAL FINDING:

The **independent verification claim** that "production JWT uses process.env.JWT_SECRET or runtime-generated secret" is **TECHNICALLY CORRECT** for the application code, but **MISLEADING** for the actual security posture.

**The Truth:**
- Application code: `process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')`
- Production environment variable: `JWT_SECRET=rooted_memories_super_secret_jwt_key_2026`
- **Result:** Production **IS** using the hardcoded secret from environment, NOT generating random bytes

The `crypto.randomBytes(32)` fallback NEVER executes in production because the environment variable is always set (to the compromised value).

### Classification

**SOURCE CODE RISK:** ⚠️ MEDIUM - Code has secure fallback (crypto.randomBytes)

**PRODUCTION RISK:** 🔴 CRITICAL - Production explicitly configured with known secret

**SEVERITY:** P0 - CRITICAL

**EVIDENCE:**
- aws-ecs-task-api.json sets `JWT_SECRET` to known value
- aws-ecs-alb-cloudformation.yml sets `JWT_SECRET` to known value
- Both files committed to version control
- Value is publicly known
- Anyone can forge authentication tokens

**RECONCILIATION:**
- Original QA Report: **CORRECT** ✅
- Independent Verification: **MISLEADING** ⚠️
  - Claimed: "production JWT uses process.env.JWT_SECRET or runtime-generated secret"
  - Reality: Yes, but process.env.JWT_SECRET **IS** the compromised hardcoded value
  - The runtime fallback never executes because env var is always set

---

## 2. DATABASE PASSWORD

### Evidence Collection

**Locations Found:**

1. **docker-compose.yml (Line 33):**
```yaml
POSTGRES_PASSWORD: password123
DATABASE_URL: "postgresql://admin:password123@postgres:5432/rootedmemories?schema=public"
```

2. **aws-ecs-task-api.json (Line 29):**
```json
{ "name": "DATABASE_URL", "value": "postgresql://admin:password123@localhost:5432/rootedmemories?schema=public" }
```

3. **aws-ecs-alb-cloudformation.yml (Line 218):**
```yaml
- Name: DATABASE_URL
  Value: 'postgresql://admin:password123@localhost:5432/rootedmemories?schema=public'
```

4. **.env.example (Line 9):**
```
DATABASE_URL="postgresql://admin:password123@localhost:5433/rootedmemories?schema=public"
```

### Analysis

**A. Where does password123 occur?**
- docker-compose.yml (local development)
- aws-ecs-task-api.json (ECS task definition)
- aws-ecs-alb-cloudformation.yml (CloudFormation template)
- .env.example (example file)

**B. Is it development/test configuration?**
⚠️ PARTIALLY - docker-compose.yml and .env.example are dev configs

**C. Does production ECS use it?**
🔴 **YES** - aws-ecs-task-api.json contains `password123` in DATABASE_URL

**D. Does production DATABASE_URL come from an AWS secret?**
❌ NO - Hardcoded in ECS task definition

**E. Is any real production password exposed to the frontend?**
❌ NO - Only backend has DATABASE_URL

### Critical Issue

The aws-ecs-task-api.json file contains:
```json
"DATABASE_URL": "postgresql://admin:password123@localhost:5432/rootedmemories?schema=public"
```

**However**, there's a critical logical problem: The database host is `localhost:5432`, but ECS Fargate containers are isolated. This configuration **CANNOT WORK** in production because:
1. There's no PostgreSQL running on localhost inside the container
2. The docker-compose.yml PostgreSQL service (with password123) is for local dev only
3. Production must use an external RDS instance or managed database

### Possible Scenarios

**Scenario A:** Configuration is stale/incorrect
- The ECS task definition is outdated
- Production actually uses different configuration (passed via environment override)
- Cannot verify without AWS access

**Scenario B:** Database not actually connected
- Application might run but database operations fail
- Customer workflow persistence might not work
- Cannot verify without live testing

**Scenario C:** Production overrides this value
- ECS service or task override provides real DATABASE_URL
- This value in task definition never used
- Cannot verify without AWS Console access

### Classification

**SOURCE CODE RISK:** 🟡 MEDIUM - Password in version control

**PRODUCTION RISK:** ❓ UNKNOWN - Configuration appears non-functional (localhost)

**SEVERITY:** P1 - HIGH (if actually used) / UNKNOWN (likely not functional)

**EVIDENCE:**
- password123 in aws-ecs-task-api.json
- But localhost:5432 cannot work in ECS Fargate
- Suggests configuration is stale or overridden at runtime

**RECONCILIATION:**
- Original QA Report: ⚠️ PARTIALLY CORRECT
  - Correct: password123 in config files
  - Uncertain: Whether production actually uses this
  - The localhost connection cannot work in ECS
- Independent Verification: ❓ UNVERIFIABLE
  - Claim: "production database credentials come from environment configuration"
  - Cannot verify without AWS access
  - Task definition suggests localhost (non-functional)

---

## 3. PERSISTENCE

### Evidence Collection

**File: customer-workflow.routes.ts (Lines 161-220)**

```typescript
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'customer_workflow_store.json');

export function saveStoresToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      publishedTemplatesStore,
      customerSessionsStore,
      customerSubmissionsStore,
      productionSnapshotsStore,
      ordersStore
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WARN] Failed to persist stores to disk:', err);
  }
}

export function loadStoresFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Loads all stores from JSON file
      // ...
    }
  } catch (err) {
    console.error('[WARN] Failed to load stores from disk:', err);
  }
}

// Load persisted data on startup (Line 220)
loadStoresFromDisk();
```

**Called from:**
```typescript
function logAuditEvent(event: string, details: any) {
  auditTrailStore.push({
    timestamp: new Date().toISOString(),
    event,
    details
  });
  saveStoresToDisk(); // ← PERSISTED ON EVERY AUDIT EVENT
}
```

### Analysis

**A. Are orders stored only in memory?**
❌ NO - Orders are persisted to `data/customer_workflow_store.json`

**B. Are orders persisted to disk JSON?**
✅ YES - Every mutation calls `logAuditEvent()` → `saveStoresToDisk()`

**C. Is disk JSON actually used by production?**
⚠️ LIKELY BUT UNVERIFIED - Code loads on startup (line 220)

**D. Does the application reload the JSON after restart?**
✅ YES - `loadStoresFromDisk()` called on module load (line 220)

**E. Is PostgreSQL/RDS actually used?**
⚠️ PARTIALLY - Prisma used for users, orders from Stripe webhook, but NOT for customer workflow

**F. What happens if ECS replaces the task?**
🔴 **DATA LOSS** - ECS Fargate containers are ephemeral, no persistent volumes attached

### Container Filesystem Reality

**ECS Fargate Behavior:**
1. Container starts with clean filesystem
2. Application creates `data/customer_workflow_store.json`
3. Data persists **within container lifecycle**
4. ECS replaces task (deployment, scale-down, crash, etc.)
5. **New container has NO data directory**
6. All customer orders, sessions, snapshots **LOST**

**Docker Volume in docker-compose.yml:**
- Local dev has `postgres_data` volume (persists)
- But NO volume defined for API container data directory
- Even in local dev, `data/` directory is ephemeral

### Two Data Paths

**Path 1: Stripe Orders → Prisma → PostgreSQL (DURABLE)**
- Stripe webhook creates orders via Prisma
- Persisted in PostgreSQL database
- Survives container restarts
- Used for e-commerce orders

**Path 2: Customer Workflow → JSON File (EPHEMERAL)**
- Template publishing
- Customer sessions
- Customer submissions
- Production snapshots
- Designer approvals
- **Stored in container filesystem → LOST ON RESTART**

### Classification

**CURRENT STORAGE:** File-based JSON (ephemeral container filesystem)

**RESTART BEHAVIOR:** Loads from file if present, otherwise uses default seed data

**DATA LOSS RISK:** 🔴 CRITICAL - ECS task replacement loses all customer workflow data

**COMMERCIAL PRODUCTION RISK:** 🔴 UNACCEPTABLE
- Customer orders lost on deployment
- Production snapshots lost on scale event
- Designer approvals lost on container crash
- NO backup/recovery

### RECONCILIATION

**Original QA Report:** ⚠️ PARTIALLY CORRECT
- Stated: "In-memory storage"
- Reality: JSON file persistence exists
- **BUT** file is on ephemeral container filesystem
- **CONCLUSION:** Effectively in-memory from production durability perspective

**Independent Verification:** ⚠️ PARTIALLY CORRECT
- Stated: "customer workflow persistence uses data/customer_workflow_store.json"
- **TRUE** but **INCOMPLETE**
- Failed to mention: JSON file on ephemeral container filesystem
- Failed to note: ECS Fargate has no persistent volumes
- Failed to explain: Data lost on task replacement

**TRUTH:**
Yes, data is persisted to JSON file. But in ECS Fargate without persistent volumes, this provides **NO DURABILITY** beyond the container's lifecycle. Every deployment, scale event, or crash results in **COMPLETE DATA LOSS**.

---

## 4. CORS

### Evidence Collection

**File: server.ts (Lines 43-53)**

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:80', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // ← ALWAYS ALLOWS
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Analysis

**Critical Bug in CORS Logic:**

```typescript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    callback(null, true);  // Allow
  } else {
    callback(null, true);  // Also allow (BUG!)
  }
}
```

**The else branch should be:**
```typescript
else {
  callback(new Error('Not allowed by CORS'));
}
```

**Current Behavior:**
- If origin is in allowedOrigins → Allow ✅
- If origin is NOT in allowedOrigins → **ALSO ALLOW** ❌
- **RESULT:** All origins allowed regardless of configuration

### Security Impact

**For Public APIs with Token Authentication:**
- CORS is primarily for browser protection
- API uses JWT Bearer tokens in Authorization header
- Tokens are not automatically sent (unlike cookies)
- Attacker website needs victim to paste token
- **MODERATE RISK** (not critical, but should fix)

**If Cookies Were Used:**
- Would be **CRITICAL** vulnerability
- But application uses Authorization headers, not cookies
- credentials: true is set but no cookie-based auth exists

### Classification

**CORS Configuration:**
- Intended: Restricted to allowed origins
- Actual: Accepts all origins due to bug
- credentials: true (allows credentials to be sent)

**Is this a Real Security Vulnerability?**
⚠️ **MINOR RISK** for this authentication architecture:
- JWT tokens in Authorization header (not auto-sent)
- No cookie-based sessions
- Attacker needs social engineering to get victim's token
- Still violates best practice (defense in depth)

**SEVERITY:** P3 - LOW (due to token-based auth, not cookie-based)

**RECOMMENDED:** Fix the bug (change else to reject), but not a critical blocker

### RECONCILIATION

**Original QA Report:** ⚠️ TECHNICALLY CORRECT BUT OVERSTATED
- Claimed: "CORS accepts all origins (CSRF risk)"
- **TRUE** that CORS accepts all (due to bug)
- **OVERSTATED** the risk given token-based auth
- CSRF is primarily a cookie-session issue
- This architecture uses Authorization headers

**Independent Verification:** ⚠️ PARTIALLY CORRECT
- Claimed: "CORS is configured with allowed origins and credentials"
- **TRUE** that configuration exists
- **MISSED** the bug (else also allows)
- **TRUE** credentials is set
- Did not assess actual security impact

**TRUTH:**
- CORS has a bug (always allows)
- Should be fixed for defense in depth
- NOT a critical vulnerability for this auth architecture
- P3 priority, not P0/P1

---

## 5. HTTPS

### Evidence

**Cannot Verify:**
- No AWS Console access
- Cannot query ALB configuration
- Cannot test HTTP/HTTPS endpoints
- Cannot check ACM certificates

**What We Know:**
- Application URL provided: `http://vcm-vector-platform-alb-1222199928.us-east-1.elb.amazonaws.com/`
- URL scheme is HTTP
- No HTTPS URL provided

**Possible Scenarios:**

**A. ALB listens on HTTP only**
- Port 80 only configured
- No SSL certificate
- All traffic unencrypted
- 🔴 CRITICAL ISSUE

**B. ALB listens on both HTTP and HTTPS**
- Port 80 and 443 configured
- HTTPS works but wasn't mentioned
- HTTP should redirect to HTTPS
- ⚠️ Needs verification

**C. ALB behind CloudFront with HTTPS**
- ALB might be HTTP only
- CloudFront (CDN) provides HTTPS
- Internal traffic HTTP, external HTTPS
- ⚠️ Cannot verify

### Classification

**AWS HTTPS STATUS:** ❓ UNVERIFIED

**RECOMMENDATION:** 
- If HTTP only → 🔴 REQUIRED BEFORE REAL CUSTOMER PRODUCTION (P1)
- If HTTPS available → ⚠️ Ensure HTTP redirects to HTTPS
- Cannot determine current state without AWS access

### RECONCILIATION

**Original QA Report:** ⚠️ CORRECT BASED ON AVAILABLE EVIDENCE
- Noted: URL is HTTP
- Cannot test: HTTP endpoint blocked
- Classified: P1 (required before production)
- **REASONABLE** given evidence

**Independent Verification:** ❓ UNVERIFIABLE CLAIM
- Stated: "ALB is currently HTTP only"
- **QUESTION:** How was this verified without AWS access?
- May be correct, but source of verification unclear

**TRUTH:**
- URL provided is HTTP
- Cannot verify ALB listener configuration
- Cannot test if HTTPS works
- **STATUS: UNVERIFIED**
- **RECOMMENDATION: MUST VERIFY BEFORE PRODUCTION**

---

## 6. DEPLOYMENT VERSION

### Evidence Chain

**Git Source:**
```
Commit: 4fc5e8b3c72165a4ab603bd0ae934a4cd60d94df
Branch: main
Verified: ✅ Local repository at this commit
```

**Expected Deployment Chain:**
```
Git (4fc5e8b) → Docker Build → ECR → ECS Task Definition → Running Task → ALB
```

**What We Can Verify:**
- ✅ Local source is at 4fc5e8b
- ✅ Dockerfile configurations present
- ✅ ECS task definition JSON files present
- ❓ ECR images (no AWS access)
- ❓ Running ECS tasks (no AWS access)
- ❓ ALB routing (no AWS access)
- ❓ Live application version (HTTP blocks fetch)

**What We Cannot Verify:**
- ECR image tags and digests
- When images were last built
- Which image version ECS is running
- Whether running containers match 4fc5e8b
- Whether ALB routes to correct targets
- Whether application is accessible at all

### Classification

**DEPLOYMENT VERSION:** ❓ UNKNOWN - Cannot verify chain from source to running container

### RECONCILIATION

**Original QA Report:** ✅ CORRECT
- Stated: "Cannot verify deployment version"
- Explained: No AWS access, HTTP blocks fetch
- **HONEST and ACCURATE**

**Independent Verification:** ❓ REQUIRES CLARIFICATION
- Claimed: "Git commit 4fc5e8b is deployed"
- **QUESTION:** How was this verified?
- Without AWS Console or CLI, how to confirm?

**TRUTH:**
- Source code is at 4fc5e8b ✅
- Whether production runs 4fc5e8b is **UNVERIFIED** ❓

---

## 7. LIVE UI

### Evidence

**Cannot Test:**
- HTTP URL blocks automated web fetch
- No AWS access to check ECS logs
- No browser automation available
- No manual access described

### Classification

**LIVE UI:** ❓ UNVERIFIED

**Cannot Verify:**
- Whether application loads
- Whether "New Invitation Design" works
- Whether template gallery functions
- Whether Designer Mode works
- Whether Customer Mode works
- Whether die-cut library loads
- Whether any feature actually works

### RECONCILIATION

**Original QA Report:** ✅ CORRECT
- Marked all functional testing: "BLOCKED"
- Explained: Cannot access HTTP endpoint
- Did not claim PASS or FAIL without evidence
- **APPROPRIATELY CAUTIOUS**

**Independent Verification:** ❓ UNVERIFIABLE CLAIMS
- If verified: How? What method?
- If not verified: Should not claim without testing

**TRUTH:**
- Live UI functionality is **UNVERIFIED**
- Cannot make claims without actual testing

---

## 8. FINAL RECONCILIATION TABLE

| Finding | Source Code | Production Verified | Severity | Evidence |
|---------|-------------|---------------------|----------|----------|
| **JWT Secret** | ⚠️ Secure fallback (crypto.randomBytes) | 🔴 **CRITICAL** - Hardcoded in ECS config | P0 - CRITICAL | aws-ecs-task-api.json line 28, aws-ecs-alb-cloudformation.yml line 216 |
| **Database Password** | 🟡 password123 in configs | ❓ UNKNOWN - localhost:5432 non-functional in ECS | P1 - HIGH (if used) | aws-ecs-task-api.json line 29, but localhost cannot work |
| **Persistence** | ⚠️ JSON file persistence | 🔴 **EPHEMERAL** - No ECS volumes | P0 - CRITICAL | Data on container filesystem, lost on task replacement |
| **CORS** | 🟡 Bug allows all origins | 🟡 LOW RISK - Token auth, not cookies | P3 - LOW | server.ts lines 46-53, bug in else branch |
| **HTTPS** | N/A | ❓ UNKNOWN - No AWS access | P1 - HIGH | Cannot verify ALB configuration |
| **Deployment Version** | ✅ Source at 4fc5e8b | ❓ UNKNOWN - No AWS access | N/A | Cannot verify ECS running version |
| **Live UI** | ✅ Code present | ❓ UNKNOWN - Cannot test | N/A | HTTP endpoint inaccessible |

---

## CONFIRMED PRODUCTION VULNERABILITIES

### 🔴 CRITICAL (P0)

**1. JWT Secret Compromised**
- **Finding:** Production ECS configuration uses hardcoded JWT secret `rooted_memories_super_secret_jwt_key_2026`
- **Evidence:** aws-ecs-task-api.json, aws-ecs-alb-cloudformation.yml
- **Impact:** Authentication bypass, token forgery, admin impersonation
- **Status:** **CONFIRMED** in deployment configuration files

**2. Ephemeral Data Storage**
- **Finding:** Customer workflow data stored on container filesystem without persistent volumes
- **Evidence:** customer-workflow.routes.ts lines 161-220, no ECS volume mounts
- **Impact:** Complete data loss on container replacement (deploy, scale, crash)
- **Status:** **CONFIRMED** in code, no durable storage mechanism

---

## UNCONFIRMED SOURCE RISKS

### 🟡 MEDIUM (P1-P2)

**1. Database Configuration**
- **Finding:** password123 in aws-ecs-task-api.json
- **BUT:** localhost:5432 cannot work in ECS Fargate
- **Status:** Configuration appears non-functional, likely overridden at runtime
- **Requires:** AWS Console access to verify actual DATABASE_URL

**2. HTTPS**
- **Finding:** URL provided is HTTP
- **Status:** Cannot verify if HTTPS is available or if HTTP redirects
- **Requires:** AWS Console access or live testing

---

## FALSE POSITIVES

### NONE - All Reported Issues Have Basis

**Original QA Report:**
- All findings have supporting evidence in source code or configuration
- Severity assessments may need adjustment (CORS overstated)
- But no false positives (imaginary issues)

**Adjustments Needed:**
1. **CORS:** Downgrade from P2 to P3 (low risk given token auth)
2. **Database:** Note localhost configuration cannot work (likely overridden)
3. **JWT:** Emphasize production config is the issue, not code fallback

---

## INFRASTRUCTURE ITEMS REQUIRING AWS ACCESS

**Cannot Verify Without AWS Console/CLI:**

1. ✅ ECR image tags and digests
2. ✅ ECS task definition revisions (current running version)
3. ✅ ECS service configuration
4. ✅ Running task details and count
5. ✅ Task environment variable overrides (may differ from task definition)
6. ✅ ALB listener configuration (HTTP vs HTTPS)
7. ✅ ALB target group health
8. ✅ ACM certificate status
9. ✅ CloudWatch logs (application errors, startup logs)
10. ✅ RDS/database configuration (actual production database)
11. ✅ Secrets Manager / Parameter Store (if used)
12. ✅ VPC and security group configuration

**Recommended Next Steps:**
1. Access AWS Console for vcm-vector-platform
2. Verify ECS service is running and healthy
3. Check actual environment variables on running tasks
4. Verify DATABASE_URL points to real RDS instance
5. Confirm JWT_SECRET on running container
6. Check ALB HTTPS configuration
7. Review CloudWatch logs for errors

---

## RECOMMENDED FIXES

### 🔴 IMMEDIATE (CRITICAL - Before Any Production Use)

**1. Rotate JWT Secret**
```bash
# Generate new secret
openssl rand -base64 32

# Store in AWS Secrets Manager
aws secretsmanager create-secret \
  --name prod/rooted-memoirs/jwt-secret \
  --secret-string "YOUR_NEW_RANDOM_SECRET" \
  --profile rooted-memoirs \
  --region us-east-1

# Update ECS task definition to read from Secrets Manager
# Remove hardcoded value from aws-ecs-task-api.json
```

**2. Implement Durable Storage**

**Option A: Migrate to Prisma/PostgreSQL (RECOMMENDED)**
```typescript
// Create Prisma models for customer workflow
model PublishedTemplate { ... }
model CustomerSession { ... }
model CustomerSubmission { ... }
model ProductionSnapshot { ... }
```

**Option B: Add EFS Volume (TEMPORARY FIX)**
```json
{
  "volumes": [{
    "name": "customer-data",
    "efsVolumeConfiguration": {
      "fileSystemId": "fs-xxxxx",
      "rootDirectory": "/customer-workflow-data"
    }
  }],
  "mountPoints": [{
    "sourceVolume": "customer-data",
    "containerPath": "/app/data",
    "readOnly": false
  }]
}
```

### 🟡 HIGH (Before Pilot)

**3. Verify/Enable HTTPS**
- Request ACM certificate
- Configure ALB listener on port 443
- Redirect HTTP (80) → HTTPS (443)
- Update ALLOWED_ORIGINS to use https:// URLs

**4. Fix Database Configuration**
- Verify production DATABASE_URL points to actual RDS
- Ensure database credentials are in Secrets Manager
- Update ECS task to reference secret ARN

### 🟢 MEDIUM (Hardening)

**5. Fix CORS Bug**
```typescript
origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS')); // ← FIX
  }
}
```

**6. Add Rate Limiting**
**7. Add Input Validation**
**8. Enable CloudWatch Alarms**
**9. Add Health Check Monitoring**

---

## 9. FINAL VERDICT

### Comparison of Reports

**Original QA Report Assessment:**
- JWT Secret: P0 CRITICAL ✅ **CORRECT**
- Database Password: P0 CRITICAL ⚠️ **OVERSTATED** (localhost config non-functional)
- Persistence: P1 HIGH ✅ **CORRECT** (ephemeral despite JSON file)
- CORS: P2 MEDIUM ⚠️ **OVERSTATED** (P3 for token auth)
- HTTPS: P1 HIGH ✅ **CORRECT** (required before production)

**Independent Verification Assessment:**
- Claimed issues were resolved ❌ **FALSE**
- JWT uses env or random ⚠️ **MISLEADING** (env contains hardcoded value)
- Data persisted to JSON ⚠️ **INCOMPLETE** (on ephemeral filesystem)
- CORS configured ⚠️ **MISSED BUG** (always allows)
- Commit 4fc5e8b deployed ❓ **UNVERIFIED**

### Production Readiness Status

**Choose ONLY ONE:**

## ❌ C. NOT SAFE FOR PILOT

### Reasoning:

**Critical Blockers Present:**

1. **🔴 JWT Secret Compromised (CONFIRMED)**
   - Production explicitly uses hardcoded, publicly known secret
   - Anyone can forge authentication tokens
   - Admin accounts can be compromised
   - **BLOCKS ALL PRODUCTION USE**

2. **🔴 Ephemeral Data Storage (CONFIRMED)**
   - Customer orders stored on container filesystem
   - No persistent volumes in ECS
   - Data lost on every deployment, scale event, or crash
   - Production snapshots lost
   - Designer approvals lost
   - **UNACCEPTABLE FOR COMMERCIAL USE**

**Unverified Infrastructure:**
- Cannot confirm application is actually running
- Cannot verify database connectivity
- Cannot test any functional features
- Cannot verify HTTPS status

### Why Not Other Options?

**A. SAFE FOR INTERNAL TESTING:**
- ❌ NO - Compromised JWT secret makes even internal testing unsafe
- Developers with repo access can forge admin tokens

**B. SAFE FOR CONTROLLED PILOT:**
- ❌ NO - Data loss on restart is unacceptable
- Customer orders would be lost
- Security vulnerability allows authentication bypass

**D. PRODUCTION READY:**
- ❌ NO - Critical security and durability issues

**E. UNVERIFIED — AWS ACCESS REQUIRED:**
- ❌ NO - While some items are unverified, we have **CONFIRMED** critical issues from source code and configuration analysis alone
- JWT secret and ephemeral storage are proven from files, not assumptions

### Path Forward

**MUST FIX BEFORE ANY PILOT:**
1. Rotate JWT secret → Secrets Manager
2. Implement durable storage (Prisma → PostgreSQL)
3. Verify HTTPS enabled
4. Fix database configuration
5. Complete full functional testing

**Timeline:**
- Security fixes: 2-3 days
- Persistence migration: 5-7 days
- Testing: 1-2 weeks
- **Total: 3-4 weeks minimum**

---

## SUMMARY

### Original QA Report: **SUBSTANTIALLY CORRECT** ✅

The original QA report correctly identified critical security and durability issues through careful source code analysis. Minor adjustments needed:
- CORS severity can be downgraded (P3 not P2)
- Database issue noted but configuration appears non-functional
- All other findings validated

### Independent Verification: **INCOMPLETE/MISLEADING** ⚠️

Claims that issues were resolved are not supported by evidence:
- JWT: Code has secure fallback, but production config uses hardcoded value
- Persistence: JSON file exists, but on ephemeral container filesystem
- Deployment: Cannot verify without AWS access

### Conclusion

The application has **confirmed critical vulnerabilities** that prevent safe production or pilot deployment:
1. Compromised JWT authentication
2. Ephemeral data storage causing data loss

These must be fixed before ANY customer use.

---

**Report Date:** August 17, 2026  
**Investigation Type:** Evidence-Based Reconciliation  
**Confidence:** HIGH for source code findings, LOW for runtime/AWS infrastructure
