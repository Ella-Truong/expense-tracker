A full-stack expense tracker built to explore backend development, databases, containerization, VPS infrastructure, logging, and CI/CD.

## Deployment

The application is deployed on a DigitalOcean VPS running Ubuntu.

### Infrastructure

- **Cloud:** DigitalOcean VPS
- **Containerization:** Docker + Docker Compose
- **Container Registry:** GitHub Container Registry (GHCR)
- **Reverse Proxy:** Nginx
- **Application:** Next.js
- **Database:** PostgreSQL running in Docker
- **ORM / Migrations:** Prisma
- **CI/CD:** GitHub Actions

### Architecture

```text
                         GitHub
                           │
                           ▼
                   GitHub Actions
                     ┌─────┴─────┐
                     │           │
                    CI           CD
                     │           │
              Lint / Build   Docker Build
                                 │
                                 ▼
                               GHCR
                                 │
                                 ▼
                              SSH → VPS
                                 │
                         Docker Compose
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              Next.js App :3000       PostgreSQL :5432
                    │
                    ▲
                    │
                 Nginx :80
                    ▲
                    │
                Internet
```
