# Deployment Guide

**Project**: Odyssey Learns  
**Last Updated**: 2024-12-30

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Building for Production](#building-for-production)
- [Deployment Options](#deployment-options)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

Odyssey Learns is a React + Vite application with Supabase backend. This guide covers deployment to various platforms and production best practices.

### Architecture Overview

```
┌─────────────────┐
│  Static Assets  │ ← CDN
│  (Vite Build)   │
└────────┬────────┘
         │
    ┌────▼────┐
    │  Edge   │ ← Vercel/Netlify
    │ Network │
    └────┬────┘
         │
    ┌────▼─────────┐
    │   Supabase   │ ← Backend
    │  (Postgres)  │
    └──────────────┘
```

---

## Prerequisites

### Required Tools

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Git**: Latest version
- **Supabase CLI**: For database management

```bash
# Install Supabase CLI
npm install -g supabase
```

### Required Accounts

1. **Supabase Account**: [supabase.com](https://supabase.com)
2. **Deployment Platform** (choose one):
   - [Vercel](https://vercel.com) (Recommended)
   - [Netlify](https://netlify.com)
   - [Cloudflare Pages](https://pages.cloudflare.com)
3. **Domain Provider** (optional): For custom domain

---

## Environment Configuration

### Environment Variables

Create `.env.production` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Optional: Error Tracking
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Optional: Feature Flags
VITE_ENABLE_BETA_FEATURES=false
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

⚠️ **Security**: Never commit `.env` files. Use platform-specific environment variable management.

---

## Building for Production

### Build Commands

```bash
# Standard production build
npm run build

# Development build (with source maps)
npm run build:dev

# Test production build locally
npm run preview
```

### Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other-assets]
└── [other-files]
```

### Build Optimization

The build process automatically:
- ✅ Minifies JavaScript and CSS
- ✅ Optimizes images
- ✅ Generates source maps (in dev mode)
- ✅ Tree-shakes unused code
- ✅ Code splits by route

**Target Bundle Size**: < 500KB (main bundle)

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel?**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Edge network (CDN)
- ✅ Environment variable management
- ✅ Preview deployments
- ✅ Free tier available

#### Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Deploy with Vercel GitHub Integration

1. **Import Project**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Set Environment Variables**:
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
   - Add any other required variables

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Access your site at `https://your-project.vercel.app`

#### Custom Domain on Vercel

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (up to 24 hours)

---

### Option 2: Netlify

#### Deploy with Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy

# Deploy to production
netlify deploy --prod
```

#### Deploy with Netlify GitHub Integration

1. **Import Project**:
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect GitHub and select repository

2. **Configure Build**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

3. **Set Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Add all required variables

4. **Deploy**:
   - Click "Deploy site"
   - Access at `https://your-site.netlify.app`

#### Netlify Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

### Option 3: Cloudflare Pages

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
npx wrangler pages publish dist --project-name=odyssey-learns
```

---

### Option 4: Self-Hosted (VPS/Docker)

#### Using Nginx

1. **Build the application**:
```bash
npm run build
```

2. **Transfer files to server**:
```bash
scp -r dist/* user@yourserver:/var/www/odyssey-learns/
```

3. **Configure Nginx**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/odyssey-learns;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. **Enable HTTPS with Let's Encrypt**:
```bash
sudo certbot --nginx -d yourdomain.com
```

#### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t odyssey-learns .
docker run -p 80:80 odyssey-learns
```

---

## Database Setup

### Initial Database Migration

1. **Link to Supabase project**:
```bash
supabase link --project-ref your-project-ref
```

2. **Apply migrations**:
```bash
supabase db push
```

3. **Verify schema**:
```bash
supabase db diff
```

### Seed Data (Optional)

For production, you may want to seed:
- Default badge definitions
- Sample lessons for each grade
- System configuration

```bash
# Run seed script
node scripts/seed-production.js
```

### Database Backups

**Automatic Backups** (Supabase Pro):
- Daily automatic backups
- Point-in-time recovery
- 7-day retention (configurable)

**Manual Backup**:
```bash
# Export schema and data
supabase db dump > backup-$(date +%Y%m%d).sql
```

---

## Post-Deployment

### 1. Verify Deployment

**Checklist**:
- [ ] Site loads at production URL
- [ ] Login functionality works
- [ ] Database connections successful
- [ ] Images and assets load
- [ ] No console errors
- [ ] Mobile responsiveness verified
- [ ] All routes accessible

### 2. Set Up Monitoring

**Recommended Tools**:

- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com) (free)
- **Error Tracking**: [Sentry](https://sentry.io)
- **Analytics**: [Google Analytics](https://analytics.google.com) or [Plausible](https://plausible.io)
- **Performance**: [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

**Sentry Setup**:
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });
}
```

### 3. Configure DNS

**A Record**:
```
Type: A
Name: @
Value: [Deployment platform IP]
TTL: Automatic
```

**CNAME Record**:
```
Type: CNAME
Name: www
Value: [Platform domain]
TTL: Automatic
```

### 4. Enable HTTPS

All deployment platforms automatically provide HTTPS:
- Vercel: Automatic SSL
- Netlify: Automatic SSL
- Cloudflare: Automatic SSL

For self-hosted:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Set Up CI/CD

**GitHub Actions Example**:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Monitoring & Maintenance

### Performance Monitoring

**Key Metrics to Track**:
- Page load time (target: < 2s)
- Time to interactive (target: < 3s)
- First contentful paint (target: < 1.5s)
- Largest contentful paint (target: < 2.5s)

**Tools**:
```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com --view

# Web Vitals
npm install web-vitals
```

### Error Monitoring

Monitor for:
- JavaScript errors
- API failures
- Authentication issues
- Database connection errors

### Database Maintenance

**Weekly**:
- Review slow queries
- Check database size
- Monitor connection pool

**Monthly**:
- Review and optimize indexes
- Archive old data
- Update statistics

**Quarterly**:
- Database performance audit
- Schema optimization review
- Backup restoration test

---

## Rollback Procedures

### Quick Rollback (Vercel/Netlify)

1. Go to deployments page
2. Find previous working deployment
3. Click "Promote to Production"
4. Confirm rollback

### Database Rollback

```bash
# Restore from backup
supabase db reset --linked

# Apply backup SQL
psql $DATABASE_URL < backup-20240115.sql
```

### Manual Rollback

```bash
# Revert to previous git commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard abc123
git push origin main --force
```

---

## Troubleshooting

### Build Fails

**Issue**: Build fails with module errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Issue**: App can't connect to Supabase

**Solution**:
1. Verify variables are set in platform dashboard
2. Check variable names start with `VITE_`
3. Rebuild and redeploy
4. Check for typos in values

### Site Returns 404

**Issue**: React routes return 404 on refresh

**Solution**:
Add redirect rules (see platform-specific config above)

### Slow Page Load

**Issue**: Site loads slowly

**Solutions**:
1. Enable CDN caching
2. Optimize images
3. Implement code splitting
4. Check bundle size
5. Enable compression

### Database Connection Errors

**Issue**: Can't connect to database

**Solutions**:
1. Verify Supabase project is active
2. Check RLS policies
3. Verify API keys are correct
4. Check network/firewall rules

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables not in code
- [ ] CSP headers configured
- [ ] RLS policies enabled
- [ ] API rate limiting active
- [ ] Authentication working
- [ ] Error messages don't expose secrets
- [ ] CORS properly configured
- [ ] Dependencies up to date
- [ ] Security headers set

---

## Performance Checklist

- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] CDN configured
- [ ] Compression enabled
- [ ] Caching headers set
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Mobile performance tested

---

## Support & Resources

- **Documentation**: [docs/](../docs/)
- **GitHub Issues**: [github.com/Krosebrook/odyssey-learns/issues](https://github.com/Krosebrook/odyssey-learns/issues)
- **Discord**: [Join community](https://discord.gg/odyssey-learns)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Last Updated**: 2024-12-30  
**Next Review**: 2025-03-30
