# Fly.io Deployment Guide

## Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

Or on macOS with Homebrew:
```bash
brew install flyctl
```

## Step 2: Login to Fly.io

```bash
flyctl auth login
```

This will open a browser for authentication. No credit card required!

## Step 3: Deploy Backend

```bash
cd backend
flyctl launch
```

When prompted:
- **App name**: `courtside-backend` (or choose your own)
- **Region**: Choose closest to you (e.g., `iad` for US East)
- **Postgres?**: No
- **Redis?**: No

This will create the app and deploy it.

## Step 4: Get Backend URL

After deployment, note the backend URL (e.g., `https://courtside-backend.fly.dev`)

## Step 5: Deploy Frontend

```bash
cd ../frontend
flyctl launch
```

When prompted:
- **App name**: `courtside-frontend` (or choose your own)
- **Region**: Same as backend
- **Postgres?**: No
- **Redis?**: No

## Step 6: Set Frontend Environment Variable

```bash
flyctl secrets set VITE_API_URL=https://courtside-backend.fly.dev -a courtside-frontend
```

This tells the frontend where to find the backend.

## Step 7: Redeploy Frontend

```bash
flyctl deploy -a courtside-frontend
```

## Done!

Your site will be live at: `https://courtside-frontend.fly.dev`

## Useful Commands

- View logs: `flyctl logs -a courtside-backend`
- Check status: `flyctl status -a courtside-backend`
- Open app: `flyctl open -a courtside-frontend`

