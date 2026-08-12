# Dockerfile — Quick Notes

## What is a Dockerfile?

A **Dockerfile** describes the reproducible process Docker follows to **build an image for an application**.

Think:

```text
Dockerfile → Docker Image → Docker Container
```

> **Dockerfile = the recipe / packaging process for your application.**

---

# Dockerfile vs Docker Compose

| | Dockerfile | `docker-compose.yml` |
|---|---|---|
| Main purpose | Build an image | Run/manage services together |
| Focus | One custom service | Multiple services |
| Example | Next.js app | Next.js + PostgreSQL |
| Key instructions | `FROM`, `RUN`, `COPY` | `services`, `image`, `build` |

Example:

```yaml
services:
  app:
    build: .

  db:
    image: postgres:17
```

- `build: .` → build **our custom application**
- `image: postgres:17` → use an **existing PostgreSQL image**

---

# Dockerfile Instructions Cheat Sheet

These are the Dockerfile instructions I should recognize.

| Instruction | Purpose | Example |
|---|---|---|
| `FROM` | Choose the base image | `FROM node:22-alpine` |
| `AS` | Give a build stage a name | `FROM node:22-alpine AS base` |
| `WORKDIR` | Set the working directory | `WORKDIR /app` |
| `COPY` | Copy files into the image | `COPY . .` |
| `COPY --from` | Copy files from another stage | `COPY --from=builder ...` |
| `RUN` | Execute a command during image building | `RUN npm ci` |
| `ENV` | Set an environment variable | `ENV NODE_ENV=production` |
| `EXPOSE` | Document the port used by the app | `EXPOSE 3000` |
| `CMD` | Default command when container starts | `CMD ["npm", "start"]` |
| `ENTRYPOINT` | Define the main executable | `ENTRYPOINT ["node"]` |
| `ARG` | Define a build-time variable | `ARG NODE_VERSION=22` |
| `LABEL` | Add metadata to an image | `LABEL app="expense-tracker"` |
| `USER` | Choose which user runs commands/app | `USER node` |
| `VOLUME` | Declare a mount point for persistent data | `VOLUME /data` |
| `HEALTHCHECK` | Define how Docker checks container health | `HEALTHCHECK CMD ...` |

---

# The Most Important Instructions

For now, focus on these:

## `FROM`

Start with a base environment.

```dockerfile
FROM node:22-alpine
```

Think:

```text
Node.js + Alpine Linux
        ↓
Base environment
```

---

## `WORKDIR`

Choose where the application lives inside the container.

```dockerfile
WORKDIR /app
```

---

## `COPY`

Bring files from the project into the image.

```dockerfile
COPY package.json package-lock.json ./
```

Then:

```dockerfile
COPY . .
```

---

## `RUN`

Execute a command **during image building**.

```dockerfile
RUN npm ci
```

or:

```dockerfile
RUN npm run build
```

---

## `ENV`

Set an environment variable.

```dockerfile
ENV NODE_ENV=production
```

---

## `EXPOSE`

Document which port the application listens on.

```dockerfile
EXPOSE 3000
```

> `EXPOSE` does not itself publish the port to the host machine.

---

## `CMD`

Define what runs when the container starts.

```dockerfile
CMD ["npm", "start"]
```

---

# `RUN` vs `CMD`

This distinction is important.

```dockerfile
RUN npm run build
```

→ Run this **while building the image**.

```dockerfile
CMD ["npm", "start"]
```

→ Run this **when the container starts**.

Think:

```text
BUILD TIME
    ↓
RUN
    ↓
Docker Image
    ↓
Container starts
    ↓
CMD
    ↓
Application runs
```

---

# Multi-Stage Dockerfile

Production applications can use multiple stages.

Example:

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
# install dependencies

FROM base AS builder
# build application

FROM base AS runner
# run production application
```

Think:

```text
node:22-alpine
       ↓
      base
       │
       ├────────→ deps
       │             ↓
       │        install dependencies
       │
       └────────→ builder
                     ↓
               build application
                     ↓
                   runner
                     ↓
              run production app
```

---

# What Does `AS` Mean?

```dockerfile
FROM node:22-alpine AS base
```

`AS base` gives this build stage a name.

Then:

```dockerfile
FROM base AS deps
```

means:

> Create a new stage called `deps`, starting from the `base` stage.

So:

```text
node:22-alpine
       ↓
      base
       ↓
      deps
```

But `base` does **not** become `deps`.

They are separate stages.

You can also have:

```text
             base
            /    \
         deps    builder
                   ↓
                 runner
```

---

# Why Multi-Stage Builds?

The **builder** may need many things to build the application:

```text
source code
development dependencies
Prisma CLI
build tools
etc.
```

But the production application doesn't necessarily need all of them.

So:

```text
Builder
   ↓
Build everything

Runner
   ↓
Copy only what production needs
```

This can create a **smaller and cleaner production image**.

---

# `COPY --from`

In a multi-stage build:

```dockerfile
COPY --from=builder /app/.next/standalone ./
```

means:

> Copy files from the `builder` stage into the current stage.

Think:

```text
builder
/app/.next/standalone
        ↓
   COPY --from
        ↓
runner
/app/.next/standalone
```

---

# Example: Next.js + Prisma

A simplified multi-stage Dockerfile:

```dockerfile
FROM node:22-alpine AS base

# Dependencies
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# Build
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

The important idea is **not** memorizing this exact file.

Understand the process:

```text
base
 ↓
Node environment

deps
 ↓
Install dependencies

builder
 ↓
Dependencies
+ source code
+ Prisma generation
+ Next.js build

runner
 ↓
Production files only
+ start command
```

---

# How to Decide What Goes in a Dockerfile

Don't start by memorizing a Dockerfile.

Ask these questions:

### 1. What runtime does my application need?

For Next.js:

```text
Node.js
```

Therefore:

```dockerfile
FROM node:22-alpine
```

### 2. Where should the application live?

```dockerfile
WORKDIR /app
```

### 3. What dependencies does it need?

Look at:

```text
package.json
package-lock.json
```

Then install them:

```dockerfile
RUN npm ci
```

### 4. What files does it need?

Use:

```dockerfile
COPY ...
```

### 5. Does the application need to be built?

For Next.js:

```dockerfile
RUN npm run build
```

### 6. What does it need at runtime?

For a production build, copy the required production files.

### 7. What command starts the application?

Look at `package.json`:

```json
{
  "scripts": {
    "start": "next start"
  }
}
```

Or, with Next.js standalone output:

```dockerfile
CMD ["node", "server.js"]
```

### 8. What port does it use?

Next.js commonly uses:

```text
3000
```

Therefore:

```dockerfile
EXPOSE 3000
```

---

# The Dockerfile Mental Model

When you see a Dockerfile, think:

```text
What environment do I start with?
        ↓
What dependencies do I need?
        ↓
Where does my app live?
        ↓
What files do I need?
        ↓
What needs to be built?
        ↓
What files are needed at runtime?
        ↓
What command starts the app?
        ↓
What port does it use?
```

---

# What I Should Remember

Don't try to memorize the exact syntax.

Remember what each instruction **means**:

```text
FROM
→ Start with a base environment

AS
→ Name a build stage

WORKDIR
→ Where the app lives

COPY
→ Bring files into the image

COPY --from
→ Copy files from another build stage

RUN
→ Execute something during image building

ENV
→ Set environment variables

EXPOSE
→ Document the application's port

CMD
→ Start the application when the container runs
```

---

# Build-Time vs Runtime

```text
BUILD TIME
────────────────────
FROM
WORKDIR
COPY
RUN
ARG
        ↓
    Docker Image
        ↓
RUNTIME
────────────────────
ENV
EXPOSE
CMD
ENTRYPOINT
```

> Note: `ENV` can be available during both build and runtime, depending on how it is used.

---

# What to Prioritize

## Learn well now

```text
FROM
WORKDIR
COPY
RUN
ENV
EXPOSE
CMD
AS
COPY --from
```

## Recognize, but don't memorize yet

```text
ENTRYPOINT
ARG
LABEL
USER
VOLUME
HEALTHCHECK
```

The goal is **not**:

> Memorize every Dockerfile instruction.

The goal is:

> **When I see an instruction, I should know what it is doing and why it might be there.**

Then I can look up the exact syntax when I need to write it.

---

# Key Mental Model

```text
Dockerfile
    ↓
Build process
    ↓
Docker Image
    ↓
Container
    ↓
Running Application
```

> **Understand the process. Look up the syntax when necessary. Don't memorize the whole Dockerfile.**