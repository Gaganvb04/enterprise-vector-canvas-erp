# Enterprise 2D Vector Canvas & Microservices Operations Platform 🚀

A high-performance **Full-Stack Monorepo Platform** featuring an interactive **2D Vector Canvas Studio (React 18 + TypeScript)**, a **Node.js Express API Gateway Microservice**, **PostgreSQL Relational Storage (Prisma ORM)**, and **AWS Cloud Infrastructure (S3, CloudFront, ALB)**.

---

## 🏛️ System Architecture Overview

```
                               ┌─────────────────────────────────────────┐
                               │   AWS Application Load Balancer (ALB)   │
                               │   Path-Based SSL/TLS Router & Gateway   │
                               └────────────────────┬────────────────────┘
                                                    │
                           ┌────────────────────────┴────────────────────────┐
                           │ Path: /*                                        │ Path: /api/*
                           ▼                                                 ▼
        ┌────────────────────────────────────┐             ┌──────────────────────────────────┐
        │ React 18 + TypeScript Studio       │             │ Node.js + Express API Gateway    │
        │ (Interactive 2D/3D Vector Canvas)  │────────────►│ (Prisma ORM, Auth, Template API) │
        └────────────────────────────────────┘  REST API   └────────┬─────────────────┬───────┘
                                                                    │                 │
                                                                    ▼                 ▼
                                                        ┌──────────────────────┐ ┌──────────────┐
                                                        │ AWS S3 + CloudFront  │ │ PostgreSQL   │
                                                        │ Presigned Asset Store│ │ Database     │
                                                        └──────────────────────┘ └──────────────┘
```

---

## 🚀 Key Technical Highlights

### 1. Frontend: Interactive 2D Vector Canvas Studio (`apps/designer-studio`)
- **React 18 + TypeScript + Zustand**: State-driven vector graphics editor built for ultra-responsive die-cut invitation card designing.
- **55+ Die-Cut Shape & Aperture Library**: Edge cuts, scallops, arches, notches, and aperture windows with instant 1-click workspace application.
- **4-Side Edge Knife Engine (`fourSides`)**: Independent 4-edge cut profiles with a 1-click **Reset to Flat Rectangle** boundary override.
- **Freehand Vector Path Smoothing**: Chaikin subdivision algorithm converting raw mouse drag points into smooth production-ready Bezier curves.
- **Multilingual Typography & Dynamic RSVP Variables**: Support for English 🇬🇧, Kannada 🇮🇳, Hindi/Sanskrit 🕉, and Telugu with smart merge tags (`{{groom_name}}`, `{{wedding_date}}`, `{{venue_name}}`).
- **Complete File Management**: Integrated **File Menu Dropdown** with **New Design** (`Ctrl+N`), **Open Design...** (`Ctrl+O`), **Save** (`Ctrl+S`), **Save As...** (`Ctrl+Shift+S`), and **Publish Template...**.

### 2. Backend: API Gateway Microservice (`apps/api-gateway`)
- **Node.js + Express.js**: REST API gateway handling request routing, payload validation, and CORS security.
- **Template Persistence REST API (`/api/templates`)**: Full CRUD operations for publishing, retrieving, and updating vector templates in PostgreSQL.
- **JWT Authentication & Security**: Secure token generation and role-based middleware verification.
- **Prisma ORM & PostgreSQL**: Relational schema migrations and transactional multi-table writes.

### 3. AWS Cloud Infrastructure
- **AWS Application Load Balancer (ALB)**: Path-based routing distributing traffic to Target Groups (`/*` to Frontend Studio, `/api/*` to Backend API Gateway).
- **Amazon S3 Presigned URLs (`vector-assets-prod-storage`)**: Direct client-to-S3 asset uploads eliminating server memory overhead during large vector file transfers (`@aws-sdk/s3-request-presigner`).
- **AWS CloudFront**: High-speed global CDN delivery for rendered vector SVG outputs and client assets.

---

## 🐳 Docker Containerization & Microservices Orchestration

The application is fully containerized using multi-stage `Dockerfile` configurations and `docker-compose`.

### Build & Start All Services locally via Docker:
```bash
docker-compose up --build -d
```

### Services Managed by Docker Compose:
| Container Service | External Port | Internal Port | Description |
| :--- | :--- | :--- | :--- |
| **`vcm-designer-studio`** | `5176` | `80` (Nginx) | Production Nginx web server serving compiled React frontend bundle |
| **`vcm-api-gateway`** | `4000` | `4000` | Node.js Express API Gateway service |
| **`postgres-db`** | `5432` | `5432` | PostgreSQL relational database container |

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in `apps/api-gateway/.env`:

```env
PORT=4000
NODE_ENV=development

# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vector_canvas_erp?schema=public"

# AWS S3 Storage Credentials
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_S3_BUCKET_NAME="vector-assets-prod-storage"
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js `v18.x` or higher
- npm `v9.x` or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Gaganvb04/vector-canvas-microservices-platform.git
cd vector-canvas-microservices-platform
npm install
```

### 2. Run Services in Parallel
```bash
npm run dev
```

### Endpoint Registry:
- 🎨 **Designer Studio Frontend**: `http://localhost:5176`
- ⚡ **Node.js API Gateway**: `http://localhost:4000`
- 🩺 **API Health Check**: `http://localhost:4000/health`
- 📂 **Cloud Templates API**: `http://localhost:4000/api/templates`
- ☁️ **AWS S3 Presigned URL Endpoint**: `http://localhost:4000/api/aws/s3/presigned-upload-url`

---

## ☁️ AWS Amazon ECS & ALB Production Deployment

### 1. Build & Push Docker Containers to AWS ECR
```powershell
.\scripts\deploy-aws-ecr.ps1 -AWSAccountId "736530791495" -AWSRegion "us-east-1"
```

### 2. Deploy ECS Fargate Cluster & ALB Infrastructure via CloudFormation
```powershell
.\scripts\deploy-aws-ecs-alb.ps1 -AWSRegion "us-east-1"
```

### 3. ALB Path-Based Routing Architecture:
- **`http://<ALB-DNS-NAME>/`** ➔ Routes to `vcm-studio-tg` (Nginx Frontend, Port 80)
- **`http://<ALB-DNS-NAME>/api/*`** ➔ Routes to `vcm-api-tg` (API Gateway, Port 4000)
- **`http://<ALB-DNS-NAME>/health`** ➔ Routes to `vcm-api-tg` Health Check Endpoint

---

## 📄 License
MIT License — Free to use for technical reference & enterprise evaluation.
