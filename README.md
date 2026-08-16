# Enterprise 2D Vector Canvas & Microservices Operations Platform 🚀

A high-performance **Full-Stack Monorepo Platform** featuring an interactive **2D Vector Canvas Studio (React 18 + TypeScript)** and an **API Gateway Microservice (Node.js + Express.js + PostgreSQL)** integrated with **AWS S3 Cloud Infrastructure**.

---

## 🏛️ System Architecture Overview

```
                          ┌──────────────────────────────────────┐
                          │   React 18 + TypeScript Web Studio   │
                          │   (Interactive 2D Vector Canvas)     │
                          └──────────────────┬───────────────────┘
                                             │
                                     REST API / JSON
                                             │
                                             ▼
                          ┌──────────────────────────────────────┐
                          │   Node.js + Express.js API Gateway   │
                          │   (JWT Auth, Prisma ORM, Gateway)    │
                          └───────┬──────────────────────┬───────┘
                                  │                      │
                                  ▼                      ▼
                      ┌──────────────────────┐ ┌───────────────────┐
                      │ AWS S3 + CloudFront  │ │ PostgreSQL DB     │
                      │ Presigned Asset Store│ │ Transact Database │
                      └──────────────────────┘ └───────────────────┘
```

---

## 🚀 Key Technical Highlights

### 1. Frontend: Interactive 2D Vector Canvas Studio (`apps/designer-studio`)
- **React 18 + TypeScript + Zustand**: State-driven vector graphics editor built with zero external UI bloat.
- **8-Handle Scaling Box Engine**: Custom SVG path bounding box scaling with dynamic `viewBox` shrink-wrapping and non-scaling stroke preservation.
- **Freehand Vector Path Smoothing**: Chaikin stroke simplification algorithm converting raw mouse drag points into smooth production-ready Bezier curves.
- **Card Outer Edge Trimming**: Vector clipping mask generator clipping outer boundary surfaces to match die-cut curves.

### 2. Backend: API Gateway Microservice (`apps/api-gateway`)
- **Node.js + Express.js**: REST API gateway handling request routing, payload validation, and CORS security.
- **JWT Authentication & Bcrypt**: Secure token generation and role-based middleware verification.
- **Prisma ORM & PostgreSQL**: Relational schema migrations and transactional multi-table writes.

### 3. AWS Infrastructure & Cloud Architecture
- **Amazon S3 Presigned URLs**: Direct client-to-S3 asset uploads eliminating server memory overhead during large file transfers (`@aws-sdk/s3-request-presigner`).
- **AWS CloudFront**: High-speed CDN delivery for rendered vector SVG outputs and client assets.
- **AWS Fargate / ALB**: Containerized microservice deployment behind AWS Application Load Balancer path-based target groups.

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

### 2. Run Both Frontend & Backend in Parallel
```bash
npm run dev
```

- **Designer Studio**: `http://localhost:5173`
- **Node.js API Gateway**: `http://localhost:4000`
- **API Health Check**: `http://localhost:4000/health`
- **AWS S3 Presigned URL Endpoint**: `http://localhost:4000/api/aws/s3/presigned-upload-url`

---

## 📄 License
MIT License — Free to use for technical reference & enterprise evaluation.
