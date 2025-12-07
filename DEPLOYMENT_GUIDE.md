# 🚀 RentEase 2.0 - Deployment Guide

## ✅ Production-Ready Fixes Completed

### 1. Security Enhancements ✅
- ✅ Strong JWT secret generated
- ✅ CORS configured for specific origins
- ✅ Helmet.js for HTTP security headers
- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ NoSQL injection prevention
- ✅ XSS attack prevention
- ✅ Input sanitization

### 2. Production Configuration ✅
- ✅ `.env.production` template created
- ✅ `.gitignore` configured
- ✅ PM2 ecosystem config for cluster mode
- ✅ Environment-aware CORS and URLs

### 3. File Upload System ✅
- ✅ Cloudinary integration configured
- ✅ Image upload routes with validation
- ✅ File size limits (5MB)
- ✅ Automatic image optimization

### 4. Frontend Configuration ✅
- ✅ Environment-aware API URLs (config.js)
- ✅ Production/development URL switching
- ✅ All hardcoded URLs removed

### 5. Server Stability ✅
- ✅ Graceful shutdown handling
- ✅ Error handling for unhandled rejections
- ✅ Socket.io connection cleanup
- ✅ MongoDB connection pooling

### 6. Logging System ✅
- ✅ Winston logger configured
- ✅ Error logs saved to files
- ✅ HTTP request logging with Morgan
- ✅ Log rotation (5MB max, 5 files)

### 7. Code Cleanup ✅
- ✅ Temporary auth controller removed
- ✅ Test-only routes cleaned
- ✅ Config files properly structured

---

## 📦 Installation & Deployment

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
Create `.env` file based on `.env.production`:
```env
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_strong_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://yourdomain.com
```

### Step 3: Update Frontend Config
Edit `frontend/js/config.js`:
```javascript
API_URL: 'https://your-backend-domain.com/api'
SOCKET_URL: 'https://your-backend-domain.com'
```

### Step 4: Deploy Backend

**Option A: PM2 (Recommended)**
```bash
npm install -g pm2
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Option B: Docker**
```bash
docker build -t rentease-backend .
docker run -p 5000:5000 --env-file .env rentease-backend
```

### Step 5: Deploy Frontend
Upload `frontend/` folder to:
- **Netlify**: Drag & drop folder
- **Vercel**: `vercel deploy`
- **GitHub Pages**: Push to gh-pages branch
- **Nginx**: Copy to `/var/www/html`

---

## 🔐 Security Checklist

- [x] JWT secret is strong (64+ characters)
- [x] MongoDB credentials not in git
- [x] CORS restricted to your domain
- [x] Rate limiting enabled
- [x] Input validation active
- [x] HTTPS enforced (configure on hosting)
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Regular backups scheduled

---

## 🌐 Hosting Recommendations

### Backend
- **Heroku**: Easy deployment, free tier available
- **Railway**: Modern, automatic deployments
- **DigitalOcean**: Full control, $5/month
- **AWS EC2**: Scalable, complex setup

### Frontend
- **Netlify**: Free, CDN, automatic deployments
- **Vercel**: Fast, optimized for static sites
- **GitHub Pages**: Free, simple setup
- **Cloudflare Pages**: Fast CDN, free tier

### Database
- **MongoDB Atlas**: Cloud MongoDB, free tier
- **Your own MongoDB**: Full control

---

## 📊 Monitoring (Recommended Additions)

Add these for production monitoring:

### Application Monitoring
```bash
npm install @sentry/node  # Error tracking
npm install prom-client   # Prometheus metrics
```

### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## 🧪 Testing Before Deployment

1. **Test locally:**
```bash
npm run dev
```

2. **Test with production settings:**
```bash
NODE_ENV=production npm start
```

3. **Check endpoints:**
- GET /api/health
- POST /api/auth/login
- GET /api/properties

4. **Load test** (optional):
```bash
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

---

## 🚨 Common Issues

### Issue: CORS errors
**Fix**: Update `CORS_ORIGIN` in `.env` with your frontend URL

### Issue: MongoDB connection fails
**Fix**: Whitelist your server IP in MongoDB Atlas

### Issue: Images not uploading
**Fix**: Check Cloudinary credentials in `.env`

### Issue: Rate limit too strict
**Fix**: Adjust in `middleware/security.js`

---

## 📝 Post-Deployment Tasks

1. **Test all features:**
   - User registration/login
   - Property CRUD operations
   - Image uploads
   - Real-time chat
   
2. **Monitor logs:**
```bash
pm2 logs
tail -f logs/error.log
```

3. **Set up SSL** (if not automatic)

4. **Configure custom domain**

5. **Set up database backups**

---

## 🎯 Performance Tips

1. **Enable gzip compression** (already in Helmet)
2. **Use CDN for static assets**
3. **Database indexing** (check MongoDB Atlas)
4. **Image optimization** (Cloudinary handles this)
5. **Caching** (add Redis for sessions)

---

## 📞 Support

For issues during deployment:
1. Check logs: `pm2 logs` or `logs/error.log`
2. Test API health: `curl https://your-domain.com/api/health`
3. Verify environment variables are loaded

---

**🎉 Your RentEase 2.0 project is now production-ready!**
