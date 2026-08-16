# Expense Tracker --- VPS, Nginx & CI/CD Notes

## 1. Big Picture

The Expense Tracker is deployed on a **self-managed VPS**.

``` text
Internet
   ↓
VPS Public IP
   ↓
Nginx :80
   ↓
Docker App :3000
   ↓
PostgreSQL :5432
```

------------------------------------------------------------------------

## 2. VPS vs Project Directory

Not everything belongs inside the `expense-tracker` project.

### VPS-level infrastructure

These are configured on the server:

``` text
VPS
├── Ubuntu
├── SSH
├── Docker / Docker Compose
├── Nginx
├── /root/.ssh/authorized_keys
└── /etc/nginx/
```

### Project-level files

``` text
~/expense-tracker/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── prisma/
└── application source code
```

**Mental model:**

> VPS = the whole computer\
> `~/expense-tracker` = your project folder inside that computer

------------------------------------------------------------------------

# 3. Nginx

Nginx is installed **outside the project** because it is server-level
infrastructure.

### Without Nginx

``` text
Browser
   ↓
VPS_IP:3000
   ↓
Docker App
```

### With Nginx

``` text
Browser
   ↓
VPS_IP:80
   ↓
Nginx
   ↓
Docker App :3000
```

Nginx is acting as a **reverse proxy**.

A domain is **not required**.

You can use:

``` text
http://VPS_IP
```

DNS becomes relevant when you add a domain:

``` text
yourdomain.com
      ↓
     DNS
      ↓
  VPS public IP
```

------------------------------------------------------------------------

# 4. SSH --- Two Different Purposes

SSH connects a **machine/process to the VPS**. The application itself
does not use SSH to communicate with the VPS.

## Personal SSH

``` text
Your Mac
   ↓ SSH
VPS
```

You use this to manually administer the server:

``` bash
ssh root@VPS_IP
```

## CI/CD SSH

``` text
GitHub Actions
      ↓ SSH
VPS
```

This allows automation to deploy to the VPS.

------------------------------------------------------------------------

# 5. SSH Keys

The VPS can trust multiple public keys.

``` text
/root/.ssh/authorized_keys

├── Mac personal public key
└── GitHub Actions deployment public key
```

The private keys stay with their owners.

``` text
Mac
└── Personal private key 🔐

GitHub Secrets
└── Deployment private key 🔐
```

`authorized_keys` contains **public keys**, never private keys.

------------------------------------------------------------------------

# 6. Personal SSH Key vs Automation SSH Key

## Personal key

Recommended:

``` text
Private key
    +
Passphrase
    ↓
VPS
```

A human can type the passphrase when connecting.

## Automation key

GitHub Actions is non-interactive:

``` text
GitHub Actions
      ↓
SSH
      ↓
Private key
      ↓
VPS
```

There is no human available to type:

``` text
Enter passphrase:
```

For this project, we created a **dedicated deployment key without a
passphrase**.

It is stored securely as:

``` text
GitHub Secrets
└── VPS_SSH_KEY
```

### Important nuance

Automation keys don't inherently have to be passphrase-free. A
passphrase can be used with an SSH agent or another non-interactive
mechanism.

Our simple approach is:

``` text
Personal key
→ passphrase protected

CI/CD key
→ dedicated
→ no passphrase
→ stored in GitHub Secret
```

------------------------------------------------------------------------

# 7. Why the First CD Failed

Our first deployment key had a passphrase.

GitHub Actions tried:

``` text
GitHub Actions
   ↓
SSH
   ↓
Private key
   ↓
"Enter passphrase?"
```

But GitHub Actions has no interactive terminal.

The error was:

``` text
debug1: read_passphrase: can't open /dev/tty:
No such device or address
```

Therefore:

``` text
Mac
 ↓
SSH
 ↓
Passphrase prompt
 ↓
Human types passphrase
 ↓
✅
```

But:

``` text
GitHub Actions
 ↓
SSH
 ↓
Passphrase prompt
 ↓
Nobody can type
 ↓
❌
```

We created a separate deployment key without a passphrase.

------------------------------------------------------------------------

# 8. CI vs CD

## CI --- Continuous Integration

CI answers:

> **"Does my code work?"**

Our CI flow:

``` text
git push
   ↓
GitHub
   ↓
GitHub Actions
   ├── npm ci
   ├── lint
   └── build
   ↓
✅ / ❌
```

CI does **not** need VPS SSH credentials because it runs on the GitHub
Actions runner.

------------------------------------------------------------------------

## CD --- Continuous Deployment

CD answers:

> **"How do I deploy the finished application?"**

Our new CD flow:

``` text
CI succeeds
   ↓
Build Docker image
   ↓
Push image → GHCR
   ↓
SSH → VPS
   ↓
docker compose pull
   ↓
docker compose up
   ↓
Prisma migration
   ↓
🚀 Running application
```

------------------------------------------------------------------------

# 9. GHCR --- GitHub Container Registry

**GHCR = GitHub Container Registry.**

It stores built Docker images.

Think of:

``` text
Dockerfile
```

as the **recipe**.

GitHub Actions is the **kitchen**.

GHCR is the **warehouse**.

VPS is the **restaurant** that runs the finished product.

``` text
Dockerfile
    ↓
GitHub Actions
    ↓
Docker image
    ↓
GHCR
    ↓
VPS
    ↓
Run container
```

Example image:

``` text
ghcr.io/ella-truong/expense-tracker:latest
```

------------------------------------------------------------------------

# 10. Why We Changed the CD Architecture

## Old architecture

Our original `docker-compose.yml` had:

``` yaml
app:
  build:
    context: .
    dockerfile: Dockerfile
```

So:

``` text
GitHub Actions
      ↓
SSH
      ↓
VPS
      ↓
docker compose up --build
      ↓
Docker build
      ↓
npm ci
      ↓
Prisma generate
      ↓
Next.js production build
```

The VPS had to **build the entire application**.

During deployment, CPU reached approximately:

``` text
99.7%
```

The VPS became difficult to access through SSH.

The deployment took more than **20 minutes**.

------------------------------------------------------------------------

# 11. What We Learned From the VPS Problem

The VPS had about:

``` text
6 GB RAM
```

But the important resource issue was CPU.

During the build:

``` text
CPU ≈ 99.7%
```

We also checked:

``` text
PostgreSQL → Up (healthy)
App → Up
```

So the application/database weren't necessarily broken.

The heavy Docker/Next.js build was consuming the VPS's resources.

Once the build stopped:

``` text
CPU → ~3%
Memory → ~36%
SSH → works again
```

This was a real-world lesson:

> **A production server doesn't necessarily need to be the build
> server.**

------------------------------------------------------------------------

# 12. New Architecture

Now the Docker image is built on GitHub Actions:

``` text
                 GitHub
                    ↓
             GitHub Actions
                    ↓
              Docker build
                    ↓
                   GHCR
                    ↓
                  VPS
                    ↓
              docker pull
                    ↓
             Run container
                    ↓
                 Nginx
                    ↓
                Internet
```

### Responsibility separation

``` text
GitHub Actions
└── Build

GHCR
└── Store Docker image

VPS
└── Run application

Nginx
└── Receive/forward HTTP traffic
```

------------------------------------------------------------------------

# 13. Dockerfile vs Docker Compose

### Dockerfile

The Dockerfile describes:

> **How to build the application image.**

It contains things like:

``` dockerfile
RUN npm ci
RUN npx prisma generate
RUN npm run build
```

These happen when the image is built.

### Docker Compose

On the VPS, Compose describes:

> **How to run the services.**

Instead of:

``` yaml
app:
  build:
    context: .
```

we now use:

``` yaml
app:
  image: ghcr.io/ella-truong/expense-tracker:latest
```

So the VPS does **not** build the image.

It pulls the already-built image.

------------------------------------------------------------------------

# 14. Current CD Flow

Conceptually:

``` text
Push to main
     ↓
CI
├── npm ci
├── lint
└── build
     ↓
CI succeeds
     ↓
CD
├── Build Docker image
├── Push image → GHCR
├── SSH → VPS
├── docker compose pull app
├── docker compose up -d
└── Prisma migrate deploy
     ↓
Nginx
     ↓
Internet
```

------------------------------------------------------------------------

# 15. CI/CD and Vercel --- Have a Sip Comparison

For **Have a Sip**, GitHub Actions ran Playwright tests.

That was essentially **CI**:

``` text
GitHub
   ↓
GitHub Actions
   ↓
Playwright
   ↓
Tests
   ↓
✅ / ❌
```

Vercel handled the deployment:

``` text
GitHub
   ↓
Vercel
   ↓
Build
   ↓
Deploy
```

So:

``` text
Have a Sip

GitHub Actions → CI
Vercel          → managed CD
```

You didn't need to write your own VPS deployment workflow because
**Vercel manages the deployment infrastructure**.

------------------------------------------------------------------------

# 16. Expense Tracker vs Vercel

### Have a Sip

``` text
GitHub
 ├── GitHub Actions
 │      ↓
 │     CI
 │
 └── Vercel
        ↓
       CD
```

### Expense Tracker

``` text
GitHub
 ├── GitHub Actions
 │      ↓
 │     CI
 │
 └── GitHub Actions
        ↓
       CD
        ↓
      GHCR
        ↓
       VPS
        ↓
      Nginx
```

Because the Expense Tracker uses a **self-managed VPS**, you are
responsible for creating the CD process.

------------------------------------------------------------------------

# 17. Why CI Doesn't Need SSH

CI:

``` text
GitHub
   ↓
GitHub Actions runner
   ↓
npm ci
lint
build
```

It never enters the VPS.

Therefore CI doesn't need:

``` text
VPS_HOST
VPS_USER
VPS_SSH_KEY
```

------------------------------------------------------------------------

# 18. Why CD Needs SSH

CD eventually needs to reach your VPS:

``` text
GitHub Actions
      ↓
      SSH 🔑
      ↓
VPS
```

Therefore CD uses:

``` text
VPS_HOST
VPS_USER
VPS_SSH_KEY
```

The deployment key is stored in GitHub Secrets.

------------------------------------------------------------------------

# 19. The Mental Model to Remember

You don't need to memorize every GitHub Actions YAML keyword.

Remember the architecture:

``` text
CI
=
Does my code work?

CD
=
How do I deploy the finished artifact?

Dockerfile
=
How do I build the image?

GHCR
=
Where do I store the image?

VPS
=
Where does my application run?

SSH
=
How do I administer/deploy to the VPS?

Nginx
=
How does public HTTP traffic reach my application?
```

------------------------------------------------------------------------

# 20. Interview Explanation

If asked:

> **"How is your Expense Tracker deployed?"**

You can explain:

> "I deployed the application to a self-managed DigitalOcean VPS. GitHub
> Actions runs CI first to lint and build the application. If CI
> succeeds, the CD workflow builds the Docker image and pushes it to
> GitHub Container Registry. It then uses a dedicated SSH deployment key
> to connect to the VPS, pulls the new image, starts the application
> with Docker Compose, and runs Prisma migrations. Nginx acts as the
> reverse proxy in front of the application."

The important skill is **understanding the flow**, not memorizing the
YAML syntax.
