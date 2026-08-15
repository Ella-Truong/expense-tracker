A full-stack expense tracker built to explore backend development, databases, containerization, VPS infrastructure, logging, and CI/CD.

## Deployment

The application is deployed on a DigitalOcean VPS running Ubuntu.

### Infrastructure

- **Cloud:** DigitalOcean VPS
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Application:** Next.js
- **Database:** PostgreSQL running in Docker
- **ORM / Migrations:** Prisma

### Architecture

```text
Internet
   ↓
DigitalOcean VPS
   ↓
Nginx :80
   ↓
Docker Container
   ├── Next.js App :3000
   └── PostgreSQL :5432