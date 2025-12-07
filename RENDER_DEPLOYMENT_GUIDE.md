# 🚀 Render.com Deployment Guide

## ✅ Backend Deployment Checklist

Your backend is **READY** for Render deployment! All required files and structure are in place.

### ✓ Files Verified:
- ✅ `server.js` - Entry point exists
- ✅ `package.json` - Has `start` script and `engines` field
- ✅ `render.json` - Proper Render configuration (fixed from Vercel config)
- ✅ `.env.example` - Environment variables documented
- ✅ Proper folder structure (config, controllers, middleware, models, routes)

---

## 📋 Step-by-Step Deployment

### 1. Prepare Git Repository
```bash
# If not already initialized
git init
git add .
git commit -m "Prepare backend for Render deployment"

# Push to GitHub/GitLab/Bitbucket
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub/GitLab/Bitbucket

### 3. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Select the `backend` folder (or root if backend is root)

### 4. Configure Service
**Basic Settings:**
- **Name:** `rentease-backend`
- **Environment:** Node
- **Region:** Choose closest to your users
- **Branch:** main (or your default branch)
- **Root Directory:** `backend` (if not in repo root)

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### 5. Set Environment Variables
Click **"Environment"** and add these variables:

```env
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<generate-secure-random-string>
PORT=5000
FRONTEND_URL=<your-netlify-url>
```

**How to get values:**
- `MONGODB_URI`: From your MongoDB Atlas cluster → Connect → Drivers
- `JWT_SECRET`: Generate with `openssl rand -base64 32` or use a password generator
- `FRONTEND_URL`: Your Netlify URL (e.g., `https://your-app.netlify.app`)

### 6. Deploy!
Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Start your server (`npm start`)
4. Assign a URL (e.g., `https://rentease-backend.onrender.com`)

---

## 🔧 Post-Deployment Configuration

### Update MongoDB Atlas
1. Go to MongoDB Atlas → Network Access
2. Add Render's IP address or use `0.0.0.0/0` (allow all)

### Update Frontend API URL
In your frontend code, change API_URL:

**Before (local):**
```javascript
const API_URL = 'http://localhost:5000/api';
```

**After (production):**
```javascript
const API_URL = 'https://rentease-backend.onrender.com/api';
```

### Update Socket.io Connection
In `frontend/js/chat.js`:

**Before:**
```javascript
const socket = io('http://localhost:5000');
```

**After:**
```javascript
const socket = io('https://rentease-backend.onrender.com');
```

### Redeploy Frontend
After updating API_URL, redeploy to Netlify:
```bash
# Commit changes
git add .
git commit -m "Update API URL to Render backend"
git push

# Netlify will auto-deploy from git
# Or manually deploy: drag & drop frontend folder to Netlify
```

---

## 🧪 Testing Deployment

### 1. Check Health Endpoint
```bash
curl https://rentease-backend.onrender.com/api/health
```

Should return: `{"status":"ok","message":"Server is running"}`

### 2. Test API Endpoints
```bash
# Test signup
curl -X POST https://rentease-backend.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!","role":"tenant"}'

# Test login
curl -X POST https://rentease-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### 3. Check Logs
In Render dashboard:
- Go to your service
- Click **"Logs"** tab
- Monitor for errors

---

## ⚠️ Important Notes

### Free Tier Limitations
- **Spins down after 15 min of inactivity**
- First request after spin-down takes ~30 seconds
- 750 hours/month free (enough for 1 service running 24/7)

### Upgrade to Paid ($7/month) for:
- No spin-down
- Faster performance
- Custom domains
- Priority support

### Socket.io Considerations
- Real-time chat works on Render free tier
- May have slight delay on first connection (spin-up time)
- Consider upgrading for better real-time performance

---

## 🐛 Troubleshooting

### Build Fails
- Check logs for missing dependencies
- Verify `package.json` has all required packages
- Ensure Node version matches (`engines` field)

### MongoDB Connection Error
- Verify `MONGODB_URI` environment variable
- Check MongoDB Atlas IP whitelist
- Ensure database user has correct permissions

### CORS Errors
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in `server.js`
- Ensure frontend uses correct backend URL

### Socket.io Not Connecting
- Check Socket.io CORS in `server.js`
- Verify using HTTPS (`wss://` protocol)
- Check browser console for connection errors

---

## 📊 Monitoring

### View Logs
```bash
# In Render dashboard
Services → rentease-backend → Logs
```

### Check Performance
- Response times
- Memory usage
- CPU usage
- Bandwidth

### Set Up Alerts
- Email notifications for deploy failures
- Downtime alerts
- Error rate monitoring

---

## 🔄 CI/CD (Optional)

Render auto-deploys on git push. To control this:

**Auto-Deploy (Recommended):**
- Every push to main branch triggers deployment
- Fast iteration and updates

**Manual Deploy:**
- Disable auto-deploy in Render settings
- Click "Manual Deploy" when ready

---

## 📝 Deployment Summary

**Your backend meets ALL Render requirements:**
- ✅ Proper project structure
- ✅ `package.json` with `start` script
- ✅ `engines` field specifying Node version
- ✅ `render.json` with correct Render configuration
- ✅ Health check endpoint at `/api/health`
- ✅ Environment variables documented in `.env.example`
- ✅ All dependencies listed in `package.json`

**Deployment Status:** 🟢 READY TO DEPLOY

---

## 🎯 Next Steps

1. ✅ Push code to GitHub/GitLab/Bitbucket
2. ✅ Create Render account
3. ✅ Connect repository and deploy
4. ✅ Set environment variables
5. ✅ Update MongoDB Atlas IP whitelist
6. ✅ Update frontend API_URL
7. ✅ Test all features
8. ✅ Share your live app!

**Need help?** Check Render docs: https://render.com/docs
