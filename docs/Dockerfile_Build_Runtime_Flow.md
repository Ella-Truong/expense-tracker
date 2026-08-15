# Dockerfile --- Multi-Stage Build Flow

## Big Picture

A Dockerfile is a reproducible recipe for turning an application into a
production Docker image.

``` text
Node.js base
   ↓
Install dependencies
   ↓
Build the application
   ↓
Prepare production environment
   ↓
Select what is needed
   ↓
Run the application
```

## Complete Dockerfile

``` dockerfile
FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# Build the application
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["node", "server.js"]
```

------------------------------------------------------------------------

## 1. Base Stage

``` dockerfile
FROM node:22-alpine AS base
```

Start with an existing Node.js image.

``` text
base
├── Linux environment
├── Node.js 22
└── npm
```

**Mental model:** Base = starting environment.

------------------------------------------------------------------------

## 2. Dependencies Stage

``` dockerfile
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci
```

This stage installs everything needed for the build.

``` text
package.json
+
package-lock.json
        ↓
      npm ci
        ↓
   node_modules
```

`/app` is inside the Docker image/container filesystem.

After this stage:

``` text
deps
└── /app
    ├── package.json
    ├── package-lock.json
    └── node_modules
```

**Mental model:** deps = install everything needed for the build.

------------------------------------------------------------------------

## 3. Builder Stage

``` dockerfile
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
```

The builder starts fresh from `base`. It does not automatically contain
anything created in `deps`.

### Reuse dependencies

``` dockerfile
COPY --from=deps /app/node_modules ./node_modules
```

Means:

``` text
deps:/app/node_modules
          ↓
builder:/app/node_modules
```

The last path is the destination.

### Copy source code

``` dockerfile
COPY . .
```

Now the builder has the source code plus dependencies.

### Generate Prisma Client

``` dockerfile
RUN npx prisma generate
```

Build-time operation that generates the Prisma Client.

### Build Next.js

``` dockerfile
RUN npm run build
```

Transforms source code into production-ready Next.js artifacts.

``` text
Source code
    ↓
npm run build
    ↓
.next/
    ↓
Production artifacts
```

**Mental model:** builder = prepare and build the application.

------------------------------------------------------------------------

## 4. Runner Stage

``` dockerfile
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
```

The runner starts fresh from `base`.

It does not automatically receive anything from `deps` or `builder`.

**Mental model:** runner = clean production environment.

### Install production dependencies

``` dockerfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```

The builder needs production + development dependencies.

The runner usually needs production dependencies only:

``` text
Builder
├── dev dependencies
└── production dependencies

Runner
└── production dependencies only
```

------------------------------------------------------------------------

## 5. Copy the Finished Application

``` dockerfile
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

The runner selectively takes finished artifacts from the builder.

``` text
builder
   │
   ├── public
   ├── .next/standalone
   └── .next/static
   │
   │ selectively copy
   ↓
runner
```

The entire builder filesystem is not copied.

------------------------------------------------------------------------

## 6. Copy Prisma Files

``` dockerfile
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
```

These files are explicitly copied from the builder into the runner.

Remember:

``` text
Prisma generate
→ build-time operation

Prisma migrate deploy
→ database deployment/runtime operation
```

------------------------------------------------------------------------

## 7. Expose Port 3000

``` dockerfile
EXPOSE 3000
```

Documents that the application listens on port 3000 inside the
container.

It does not by itself make the application publicly accessible.

``` text
Container
└── Next.js
    └── :3000
```

------------------------------------------------------------------------

## 8. Start the Application

``` dockerfile
CMD ["node", "server.js"]
```

When the container starts:

``` text
Container starts
      ↓
node server.js
      ↓
Next.js production application
```

------------------------------------------------------------------------

# Complete Multi-Stage Flow

``` text
                     node:22-alpine
                           ↓
                         base
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
            deps                      builder
              ↓                         ↓
           npm ci              copy dependencies
              ↓                         ↓
        node_modules            copy source code
                                        ↓
                                 prisma generate
                                        ↓
                                   npm run build
                                        ↓
                              production artifacts
                                        │
                                        ↓
                                     runner
                                        ↓
                             production dependencies
                                        +
                               finished application
                                        +
                                  required Prisma files
                                        ↓
                                 node server.js
                                        ↓
                                   Running app
```

## Multi-Stage Mental Model

Think of it like a factory:

``` text
🏭 BUILDER
    │
    ├── dependencies
    ├── source code
    ├── development tools
    ├── Prisma generation
    └── Next.js build
    │
    ↓
📦 Finished production artifacts
    │
    ↓ selectively copy
🚀 RUNNER
    │
    ├── Node.js
    ├── production dependencies
    ├── Next.js production build
    ├── public files
    └── required Prisma files
```

> **Builder = create the application.**
>
> **Runner = run the finished application.**

------------------------------------------------------------------------

# Why Use a Builder and Runner?

A single-stage image could build and run everything:

``` dockerfile
FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

CMD ["npm", "start"]
```

But the final image can then contain:

``` text
source code
+
development dependencies
+
build tools
+
production dependencies
+
finished application
```

Multi-stage builds separate the purposes:

``` text
Builder
→ Everything needed to BUILD

Runner
→ Only what is needed to RUN
```

The important idea is **not mainly faster copying**.

It is:

> Complete the build first, then create a clean runtime environment
> containing only what is needed.

------------------------------------------------------------------------

# Important Dockerfile Concepts

## `FROM`

Choose the starting image.

``` dockerfile
FROM node:22-alpine
```

## `AS`

Give a build stage a name.

``` dockerfile
FROM node:22-alpine AS builder
```

## `WORKDIR`

Choose the working directory inside the image/container.

``` dockerfile
WORKDIR /app
```

Important:

``` text
VPS filesystem
    ≠
Container filesystem
```

## `COPY`

Copy files into the current stage.

``` dockerfile
COPY package.json package-lock.json ./
```

General structure:

``` text
COPY source destination
```

## `COPY --from`

Copy files from another build stage.

``` dockerfile
COPY --from=deps /app/node_modules ./node_modules
```

Read it as:

``` text
deps:/app/node_modules
          ↓
current stage:/app/node_modules
```

## `RUN`

Run a command during image building.

``` dockerfile
RUN npm ci
RUN npm run build
RUN npx prisma generate
```

## `ENV`

Set an environment variable.

``` dockerfile
ENV NODE_ENV=production
```

## `EXPOSE`

Document the port the application uses.

``` dockerfile
EXPOSE 3000
```

## `CMD`

Define the default command that runs when the container starts.

``` dockerfile
CMD ["node", "server.js"]
```

------------------------------------------------------------------------

# What I Actually Need to Remember

You do not need to memorize every Dockerfile instruction.

Understand the flow:

``` text
What environment does the app need?
        ↓
FROM

Where does the app live?
        ↓
WORKDIR

What dependencies does it need?
        ↓
COPY + RUN npm ci

What source code does it need?
        ↓
COPY

What needs to be generated/built?
        ↓
RUN

What is needed in production?
        ↓
COPY --from=builder

What command starts the app?
        ↓
CMD
```

## Core Mental Model

``` text
FROM
  ↓
Install dependencies
  ↓
Build application
  ↓
Prepare production environment
  ↓
Select what is needed
  ↓
Run application
```

> **Dockerfile = the reproducible recipe for turning an application into
> a production container image.**

------------------------------------------------------------------------

# Docker, VPS, and `/app`

The Dockerfile runs inside Docker, which itself runs on the VPS.

``` text
☁️ Cloud Provider
   ↓
🖥️ VPS
   ↓
🐧 Linux
   ↓
🐳 Docker
   ↓
📦 App Container
   ↓
/app
   ↓
Next.js application
```

Therefore:

``` dockerfile
WORKDIR /app
```

means:

> **Inside this Docker container, use `/app` as the working directory.**

It does not mean `/app` directly on the VPS.

------------------------------------------------------------------------

# SSH and the VPS

Your Mac Terminal remains on your Mac.

When you run:

``` bash
ssh root@YOUR_VPS_IP
```

your Mac Terminal connects to a shell running on the VPS.

``` text
💻 Mac
└── Terminal
      │
      │ SSH
      ↓
🖥️ VPS
└── Linux shell
      │
      ├── Linux commands
      │
      └── Docker commands
             ↓
         Containers
```

For example:

``` bash
ls
```

runs on the VPS after SSH.

``` bash
docker ps
```

asks Docker on the VPS for its running containers.

``` bash
docker exec -it app sh
```

enters the app container running on the VPS.

------------------------------------------------------------------------

# Final Mental Model

``` text
💻 Mac
   │
   │ SSH
   ↓
🖥️ VPS
   │
   └── 🐧 Linux
          │
          └── 🐳 Docker
                 │
                 ├── 📦 App Container
                 │      └── /app
                 │           └── Next.js
                 │
                 └── 📦 Database Container
                        └── PostgreSQL
```

And the Dockerfile controls how the App Container image is built:

``` text
Node.js base
    ↓
Dependencies
    ↓
Builder
    ↓
Production artifacts
    ↓
Runner
    ↓
Next.js application
```

## One-Sentence Summary

> **Install everything needed → build everything → start a clean
> production stage → copy only what is needed → run the application.**
