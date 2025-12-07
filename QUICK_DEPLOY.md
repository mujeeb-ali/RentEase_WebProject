# Quick Deployment Instructions

## 🚀 Deploy in 3 Steps:

### 1️⃣ Deploy Backend (Render.com)
1. Go to https://render.com
2. New → Web Service → Connect GitHub repo
3. Settings:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
4. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://johnowner:john123@cluster0.9oxofxn.mongodb.net/rentease
   JWT_SECRET=your-random-secret-key-here
   NODE_ENV=production
   FRONTEND_URL=https://your-netlify-url.netlify.app
   ```
5. Deploy! Copy your URL: `https://rentease-backend.onrender.com`

### 2️⃣ Update Config
Edit `frontend/js/config.js` line 10 and 15:
```javascript
: 'https://rentease-backend.onrender.com/api',  // Your Render URL
: 'https://rentease-backend.onrender.com',      // Your Render URL
```

### 3️⃣ Deploy Frontend (Netlify)
1. Go to https://netlify.com
2. New site → Import from GitHub
3. Settings:
   - Publish directory: `frontend`
4. Deploy!

## ✅ Done!
Your app is live at: `https://your-app.netlify.app`

## 📝 Important Notes:
- Free tier: Backend sleeps after 15 min (first load = 30s wait)
- MongoDB already cloud-hosted ✅
- Both auto-deploy on git push
- HTTPS enabled automatically
